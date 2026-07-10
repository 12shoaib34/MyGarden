import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const GLOBAL_SAFE_AREA_TOP_OFFSET = 14;
export const GLOBAL_SAFE_AREA_BOTTOM_OFFSET = 8;
export const GLOBAL_CONTENT_TOP_OFFSET = 24;

export const useGetSafeAreaInsets = () => {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      ...insets,
      top: insets.top + GLOBAL_SAFE_AREA_TOP_OFFSET,
      bottom: insets.bottom + GLOBAL_SAFE_AREA_BOTTOM_OFFSET,
      contentTop: insets.top + GLOBAL_CONTENT_TOP_OFFSET,
      sheetBottomInset: insets.bottom,
    }),
    [insets],
  );
};

export const getSafeAreaInsets = useGetSafeAreaInsets;

export default useGetSafeAreaInsets;
