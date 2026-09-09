/**
 * A Mongoose `.lean()` result is mostly a plain object, but any
 * ObjectId-typed field (`_id`, and reference fields like `Property.agent`)
 * stays a real BSON `ObjectId` class instance — which carries its own
 * `toJSON()` method. That's harmless for a plain Server Component (nothing
 * about rendering HTML cares), but React's RSC boundary rejects it the
 * moment it's passed as a prop into a Client Component: "Only plain
 * objects can be passed to Client Components from Server Components.
 * Objects with toJSON methods are not supported."
 *
 * Round-tripping through JSON forces every such field through its
 * toJSON() (ObjectId -> hex string, Date -> ISO string), leaving a fully
 * plain, JSON-safe object/array that's safe to hand to a Client
 * Component. Only needed at that specific boundary — a lean() result
 * consumed entirely within Server Components never needs this.
 */
export function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
