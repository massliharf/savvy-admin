// Object -> multipart FormData, identical to the production serializer (nl / g2):
// null/undefined skipped, File appended as-is, Date -> ISO, arrays -> key[i], objects -> a.b
export function toFormData(value) {
  const fd = new FormData();
  append(fd, value, undefined);
  return fd;
}

function append(fd, value, key) {
  if (value == null) return;
  if (value instanceof File) {
    fd.append(key, value);
    return;
  }
  if (value instanceof Date) {
    fd.append(key, value.toISOString());
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      if (typeof item === "object" && !(item instanceof File) && !(item instanceof Date))
        append(fd, item, `${key}[${i}]`);
      else fd.append(`${key}[${i}]`, String(item));
    });
    return;
  }
  if (typeof value === "object") {
    for (const k of Object.keys(value)) append(fd, value[k], key ? `${key}.${k}` : k);
    return;
  }
  fd.append(key, String(value));
}
