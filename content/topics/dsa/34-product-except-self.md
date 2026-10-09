---
title: Product of array except self
stack: dsa
order: 34
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "For each position, return the product of every OTHER number. Usually you may not use division."
  - "Brute force multiplies everything except i, for every i: O(n²)."
  - "Optimal: answer[i] = (product of everything on the left) × (product of everything on the right)."
  - "Two passes — left to right, then right to left — give O(n) time and O(1) extra space (not counting the answer)."
  - "Division fails when the array has a zero, which is why interviewers ban it."
cards:
  - q: What does "product of array except self" return?
    a: A new array where each spot holds the product of all the other numbers, not including the number at that spot.
  - q: What is the main idea of the O(n) solution?
    a: "answer[i] = product of everything left of i × product of everything right of i. Fill the left products in one pass, then multiply by the right products in a second pass."
  - q: Why not just divide the total product by nums[i]?
    a: The question usually forbids division. Also, if a number is 0 you would divide by zero.
  - q: "What is the answer for [1, 2, 3, 4]?"
    a: "[24, 12, 8, 6]. For example, 24 = 2 × 3 × 4."
  - q: What is the extra space of the two-pass solution?
    a: O(1) extra, because only two running numbers are kept. The output array itself is not counted.
---

## 💡 What is it?

You get an array of numbers. Build a **new array** of the same length.

Each spot in the new array must hold **the product of all the other numbers**, everything except the number at that spot. Usually you may **not use division**.

Example: `[1, 2, 3, 4]` → `[24, 12, 8, 6]`. The first answer is `2 × 3 × 4 = 24`.

## 🏠 Real-life example

Think of **students standing in a line**, each holding a number card.

For each student, you want "everyone else's numbers multiplied together".

- **Walk from the front**, and tell each student the product of everyone *in front* of them.
- **Walk from the back**, and multiply in the product of everyone *behind* them.
- Now each student knows the product of everyone except themselves.

Mapping:
- **Each student** = one index `i`.
- **"Product of everyone in front"** = the `left` running product.
- **"Product of everyone behind"** = the `right` running product.
- **Two walks down the line** = two passes over the array.

## 🧑‍💻 Code example

Save as `product.js`. Run `node product.js`.

```js
// Way 1 — array methods (brute force: multiply everything except index i)
const productBrute = (nums) =>                         // nums = the array of numbers
  nums.map((_, i) =>                                   // build one answer for each index i
    nums.reduce((prod, x, j) => (j === i ? prod : prod * x), 1)); // multiply all except position i

// Way 2 — plain loops (left products, then right products, no division)
function productExceptSelf(nums) {                     // nums = the array of numbers
  const n = nums.length;                               // how many numbers
  const result = new Array(n);                         // the answer array
  let left = 1;                                        // product of everything to the LEFT of i
  for (let i = 0; i < n; i++) {                        // walk left to right
    result[i] = left;                                  // store the left product for i
    left = left * nums[i];                             // include nums[i] for the next index
  }                                                    // end of the left pass
  let right = 1;                                       // product of everything to the RIGHT of i
  for (let i = n - 1; i >= 0; i--) {                   // walk right to left
    result[i] = result[i] * right;                     // left product × right product
    right = right * nums[i];                           // include nums[i] for the next index
  }                                                    // end of the right pass
  return result;                                       // each spot = product of all the others
}                                                      // end of productExceptSelf

console.log(productBrute([1, 2, 3, 4]));               // [24, 12, 8, 6]
console.log(productExceptSelf([1, 2, 3, 4]));          // [24, 12, 8, 6]
console.log(productExceptSelf([2, 0, 5]));             // a zero in the input
```

**Output:**

```text
[ 24, 12, 8, 6 ]
[ 24, 12, 8, 6 ]
[ 0, 10, 0 ]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Extra space | Why |
|---|---|---|---|
| Brute force | O(n²) | O(1) | For each `i`, multiply all `n` numbers. |
| Two passes | O(n) | O(1) | Two walks; only `left` and `right` are kept. The output array isn't counted. |

**Dry run** on `[1, 2, 3, 4]`:

| i | after left pass (product of left side) | right product used | final answer |
|---|---|---|---|
| 0 | 1 | 2×3×4 = 24 | **24** |
| 1 | 1 | 3×4 = 12 | **12** |
| 2 | 1×2 = 2 | 4 | **8** |
| 3 | 1×2×3 = 6 | 1 | **6** |

**Why not division?** Total product ÷ `nums[i]` looks easy. But with a `0` it breaks:
- One zero → every answer is 0 except at the zero's own spot.
- Two zeros → every answer is 0.

The two-pass method handles zeros on its own, with no special cases. You can see this in the `[2, 0, 5]` output.

**Edge cases:** one zero, two zeros, negative numbers, an array of length 2, and very large products. In JavaScript, numbers above 2⁵³ lose precision; you could use `BigInt` if that matters.

## 🎯 Why do we use it?

- It is a popular medium question (LeetCode "Product of Array Except Self").
- It teaches the **prefix / suffix** idea: precompute what is to the left and to the right. That is the same thinking as [prefix sums](topic:dsa/pattern-prefix-sum).
- Real uses: "each item's share when everyone else is combined", for example in scoring or probability.

## ⚠️ Common mistakes

- **Using division** when the question forbids it, or forgetting the zero case.
- **Starting `left` or `right` at 0** instead of 1. Anything times 0 is 0.
- **Updating `left` before storing it.** Store the product of the *left side first*, then multiply in `nums[i]`.
- **Creating two extra arrays** (left and right) and saying it's O(1) space. That version is O(n) extra; the two-variable version is O(1).

## 🗣️ How to answer in an interview

> "For each index I need the product of every other number, without division. Can there be zeros or negatives?
>
> The brute force multiplies all the others for each index, which is O(n²).
>
> Better: the answer at i is the product of everything on its left times everything on its right. So I walk left to right, storing the running left product in the result. Then I walk right to left, keeping a running right product and multiplying it in.
>
> That's O(n) time and O(1) extra space, apart from the output. It also handles zeros correctly, which division would not."

## 🔁 Follow-up questions

### What if division were allowed?

Multiply everything once, then divide by `nums[i]`. But you must handle zeros: count them. With two or more zeros, everything is 0. With exactly one zero, only that spot gets the product of the non-zero numbers.

### Can you do it with O(n) extra space first, to explain?

Yes. Build a `leftProducts` array and a `rightProducts` array, then multiply them spot by spot. It's easier to explain, but uses two extra arrays.

### What if the product is too large?

JavaScript numbers lose precision above about 9 × 10¹⁵. Use `BigInt` for exact results, or use logarithms if you only need to compare sizes.

### How is this related to prefix sums?

It's the same idea with multiplication instead of addition: precompute running results from one side, and then from the other.

## ✅ Quick check

### 1. What does `productExceptSelf([3, 4])` return?

:::answer
**`[4, 3]`.** Each spot gets the only other number.
:::

### 2. What does `productExceptSelf([0, 0, 7])` return?

:::answer
**`[0, 0, 0]`.** Every spot has at least one other zero in its product.
:::

### 3. Why must `left` and `right` start at 1?

:::answer
1 is the "empty product". It doesn't change a value when you multiply by it. Starting at 0 would make every answer 0.
:::
