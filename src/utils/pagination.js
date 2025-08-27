export function paginate(query, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}
