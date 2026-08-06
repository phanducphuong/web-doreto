import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  ConversionCanceledError,
  Input,
  Mp4OutputFormat,
  Output,
} from "mediabunny";
import {
  VIDEO_COMPRESSION_AUDIO_BITRATE,
  VIDEO_COMPRESSION_MAX_VIDEO_BITRATE,
  VIDEO_COMPRESSION_MAX_WIDTH,
  VIDEO_COMPRESSION_MIN_VIDEO_BITRATE,
  VIDEO_COMPRESSION_SIZE_SAFETY,
  VIDEO_UPLOAD_MAX_BYTES,
  VIDEO_UPLOAD_MAX_SOURCE_BYTES,
} from "~/constants/video-upload.constant";

export type TCompressVideoOptions = {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

function toMp4FileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, "").trim() || "video";
  return `${baseName}.mp4`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Video compression cancelled", "AbortError");
  }
}

/**
 * Video ≤ 50MB: giữ nguyên. Video > 50MB: nén lại bằng WebCodecs (mediabunny)
 * — tính bitrate theo thời lượng sao cho kết quả vừa khít ≤ 50MB, xuất MP4
 * (H.264). Chạy hoàn toàn trên trình duyệt, không tốn server.
 */
export async function compressVideoFile(
  file: File,
  options?: TCompressVideoOptions,
): Promise<File> {
  if (file.size <= VIDEO_UPLOAD_MAX_BYTES) {
    return file;
  }

  if (file.size > VIDEO_UPLOAD_MAX_SOURCE_BYTES) {
    throw new Error("Video quá lớn (tối đa 500MB). Vui lòng cắt ngắn hoặc nén trước.");
  }

  if (typeof VideoEncoder === "undefined") {
    throw new Error(
      "Trình duyệt này không hỗ trợ nén video. Vui lòng dùng Chrome/Edge bản mới, hoặc tự nén video xuống dưới 50MB rồi thử lại.",
    );
  }

  throwIfAborted(options?.signal);

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const duration = await input.computeDuration();
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Không đọc được thời lượng video để nén.");
  }

  const videoTrack = await input.getPrimaryVideoTrack();
  const targetWidth = Math.min(
    videoTrack?.displayWidth || VIDEO_COMPRESSION_MAX_WIDTH,
    VIDEO_COMPRESSION_MAX_WIDTH,
  );

  const totalBits = VIDEO_UPLOAD_MAX_BYTES * 8 * VIDEO_COMPRESSION_SIZE_SAFETY;
  const rawVideoBitrate = totalBits / duration - VIDEO_COMPRESSION_AUDIO_BITRATE;

  if (rawVideoBitrate < VIDEO_COMPRESSION_MIN_VIDEO_BITRATE) {
    throw new Error(
      "Video quá dài để nén xuống 50MB mà vẫn giữ được chất lượng. Vui lòng cắt ngắn video rồi thử lại.",
    );
  }

  // Nén tối đa 2 lượt: lượt 2 hạ bitrate thêm nếu lượt 1 vẫn lố 50MB (hiếm).
  let videoBitrate = Math.min(rawVideoBitrate, VIDEO_COMPRESSION_MAX_VIDEO_BITRATE);

  for (let attempt = 0; attempt < 2; attempt++) {
    throwIfAborted(options?.signal);

    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    });

    const conversion = await Conversion.init({
      input,
      output,
      video: {
        width: targetWidth,
        bitrate: Math.round(videoBitrate),
      },
      audio: {
        bitrate: VIDEO_COMPRESSION_AUDIO_BITRATE,
      },
    });

    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks.map((track) => track.reason).join(", ");
      throw new Error(`Không nén được video này trên trình duyệt (${reasons}).`);
    }

    conversion.onProgress = (progress) => {
      options?.onProgress?.(Math.min(100, Math.round(progress * 100)));
    };

    const onAbort = () => {
      void conversion.cancel();
    };
    options?.signal?.addEventListener("abort", onAbort, { once: true });

    try {
      await conversion.execute();
    } catch (error) {
      if (error instanceof ConversionCanceledError) {
        throw new DOMException("Video compression cancelled", "AbortError");
      }
      throw error;
    } finally {
      options?.signal?.removeEventListener("abort", onAbort);
    }

    const buffer = output.target.buffer;
    if (!buffer) {
      throw new Error("Nén video thất bại (không có dữ liệu đầu ra).");
    }

    const result = new File([buffer], toMp4FileName(file.name), {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    if (import.meta.dev) {
      console.info(
        `[video-compression] ${file.name}: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(result.size / 1024 / 1024).toFixed(1)}MB (bitrate ${Math.round(videoBitrate / 1000)}kbps, lượt ${attempt + 1})`,
      );
    }

    if (result.size <= VIDEO_UPLOAD_MAX_BYTES) {
      return result;
    }

    // Vẫn lố giới hạn → hạ bitrate theo đúng tỉ lệ vượt rồi nén lại lần cuối.
    videoBitrate = Math.max(
      VIDEO_COMPRESSION_MIN_VIDEO_BITRATE,
      videoBitrate * ((VIDEO_UPLOAD_MAX_BYTES / result.size) * 0.95),
    );
  }

  throw new Error("Không nén được video xuống dưới 50MB. Vui lòng cắt ngắn video rồi thử lại.");
}
