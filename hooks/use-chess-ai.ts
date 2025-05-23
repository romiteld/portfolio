"use client";

import { useEffect, useState } from "react";
import { initializeModel, selectMoveWithModel, evaluatePositionWithModel } from "@/app/chess/utils/clientNeuralNet";

export function useChessAI() {
  const [modelReady, setModelReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadModel() {
      if (typeof window === "undefined") return;

      setLoading(true);
      try {
        const loadedSession = await initializeModel();
        if (mounted) {
          setModelReady(!!loadedSession);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    selectMove: selectMoveWithModel,
    evaluate: evaluatePositionWithModel,
    modelReady,
    loading,
    error,
  };
}
