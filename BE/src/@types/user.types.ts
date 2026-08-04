import { UserDocument } from 'src/users/schemas/user.schema';

export type TUserUpdateResponse = Omit<UserDocument, 'password'>;
