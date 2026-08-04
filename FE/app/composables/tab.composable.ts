export const useTab = (defaultValue?: any) => {
  const currentTab = ref(defaultValue);

  const setCurrentTab = (value: any) => {
    currentTab.value = value;
  };

  return {
    currentTab,
    setCurrentTab,
  };
};
