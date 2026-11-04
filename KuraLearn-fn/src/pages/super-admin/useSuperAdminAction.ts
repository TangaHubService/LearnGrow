import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";

/** Runs a Super Admin change, refreshes the Super Admin pages, and reports the result. */
export function useSuperAdminAction<Input>(
  run: (input: Input) => Promise<unknown>,
  successMessage: (input: Input) => string,
) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: run,
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      dispatch(pushToast({ tone: "success", message: successMessage(input) }));
    },
    onError: (error) => {
      dispatch(pushToast({ tone: "error", message: (error as Error).message }));
    },
  });
}
