import { useCallback, useEffect, useRef } from 'react';

/**
 * 防抖Hook - 延迟执行函数，在指定时间内多次调用只执行最后一次
 * @param callback 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param deps 依赖数组，当依赖变化时会重新创建防抖函数
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // 更新回调函数引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay, ...deps]
  );

  return debouncedCallback;
}

/**
 * 防抖值Hook - 延迟更新值，在指定时间内多次变化只返回最后一次的值
 * @param value 要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 搜索防抖Hook - 专门用于搜索场景的防抖
 * @param searchFunction 搜索函数
 * @param delay 延迟时间（毫秒），默认300ms
 * @param minLength 最小搜索长度，默认1
 * @returns 防抖后的搜索函数
 */
export function useSearchDebounce<T extends (...args: any[]) => any>(
  searchFunction: T,
  delay: number = 300,
  minLength: number = 1
): T {
  const debouncedSearch = useDebounce(
    useCallback(
      ((...args: Parameters<T>) => {
        // 假设第一个参数是搜索关键词
        const query = args[0];
        
        // 如果是字符串且长度不足，不执行搜索
        if (typeof query === 'string' && query.length < minLength) {
          return;
        }
        
        // 执行搜索
        searchFunction(...args);
      }) as T,
      [searchFunction, minLength]
    ),
    delay
  );

  return debouncedSearch;
}

/**
 * 输入防抖Hook - 专门用于输入框的防抖处理
 * @param onInputChange 输入变化回调
 * @param delay 延迟时间（毫秒），默认300ms
 * @returns 防抖后的输入处理函数
 */
export function useInputDebounce(
  onInputChange: (value: string) => void,
  delay: number = 300
) {
  const debouncedOnChange = useDebounce(
    useCallback((value: string) => {
      onInputChange(value);
    }, [onInputChange]),
    delay
  );

  return debouncedOnChange;
}

/**
 * API调用防抖Hook - 专门用于API调用的防抖
 * @param apiCall API调用函数
 * @param delay 延迟时间（毫秒），默认500ms
 * @returns 防抖后的API调用函数和取消函数
 */
export function useApiDebounce<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  delay: number = 500
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const debouncedApiCall = useCallback(
    ((...args: Parameters<T>) => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            // 创建新的AbortController
            abortControllerRef.current = new AbortController();
            
            // 如果API函数支持AbortSignal，添加到参数中
            const result = await apiCall(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    }) as T,
    [apiCall, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return [debouncedApiCall, cancel];
}

// 导入React（如果需要）
import React from 'react';
