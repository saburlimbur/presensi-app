import { ValidationError } from "./error.js";

export const validate = (schema, data) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new ValidationError(
      "validasi data gagal",
      error.details.map((e) => `${e.path} - ${e.message}`),
    );
  }
  return value;
};
