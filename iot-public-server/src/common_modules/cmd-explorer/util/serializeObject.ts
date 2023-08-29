import crypto from "node:crypto";
export type TSerializationOptions = {
  filterBlob?: boolean;
  mapToObject?: boolean;
  jsonSpace?: number;
  errorVerbosity?: 1 | 2;
};

export function serializeObject(obj: any, opts?: TSerializationOptions) {
  const { filterBlob = true, mapToObject = true, jsonSpace = 2 } = opts ?? {};
  const circular: any[] = [];
  const objectStr = JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (circular.includes(value)) return "[Circular]";
        if (value instanceof Error && opts?.errorVerbosity === 1) {
          return {
            type: value?.constructor?.name,
            message: value?.message,
          };
        }
        if (filterBlob && value?.type === "Buffer")
          return {
            type: value?.type,
            data_len: value?.data?.length,
            sha1sum: crypto
              .createHash("sha1")
              .update(Buffer.from(value?.data ?? ""))
              .digest("hex"),
          };
        if (mapToObject && value instanceof Map) return Object.fromEntries(value.entries());
        if (Array.isArray(value)) {
          const array: any[] = [];
          value.forEach((item, i) => {
            if (opts?.filterBlob && item?.type === "Buffer") {
              array.push({ type: item?.type, data_len: item?.data?.length });
            } else if (opts?.mapToObject && item instanceof Map) {
              array.push(Object.fromEntries(item.entries()));
            } else {
              array.push(item);
            }
          });
          return array;
        }
        circular.push(value);
      }
      return value;
    },
    jsonSpace
  );
  circular.length = 0;
  return objectStr;
}
