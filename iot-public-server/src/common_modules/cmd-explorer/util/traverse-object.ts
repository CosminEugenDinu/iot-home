export function traverseObject(obj: any, cb?: (objValue: any) => boolean) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === "object") {
        if (cb && cb(value)) continue;
        traverseObject(value, cb);
      }
    }
  }
}
