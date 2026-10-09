---
title: Best time to buy and sell stock
stack: dsa
order: 32
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Buy on one day, sell on a later day, maximise the profit. If prices only fall, the answer is 0."
  - "Brute force: try every buy/sell pair — O(n²)."
  - "One pass: track the cheapest price so far; at each day, profit = today − cheapest. O(n) time, O(1) space."
  - "The trick is \"remember the best so far\" — the same idea as Kadane's algorithm."
cards:
  - q: What is the one-pass idea for buy and sell stock?
    a: Walk through the days, keep the lowest price seen so far, and at each day compute today's price minus that lowest price. Keep the best.
  - q: What do you return if prices only go down?
    a: 0 — it's better not to trade at all.
  - q: Why can't you just do max − min of the array?
    a: The max might come before the min. You must buy before you sell.
  - q: What are the complexities of the two solutions?
    a: Brute force O(n²) time, O(1) space. One pass O(n) time, O(1) space.
  - q: How does this relate to Kadane's algorithm?
    a: Both make one pass and keep a "best so far" plus a running value. Here the running value is the minimum price.
---

## 💡 What is it?

You get the price of a stock for each day. You may **buy once** and **sell once, on a later day**. Find the **biggest profit**. If no trade makes money, the answer is **0**.

Example: prices `[7, 1, 5, 3, 6, 4]` → buy at 1 (day 2), sell at 6 (day 5) → profit **5**.

This is LeetCode "Best Time to Buy and Sell Stock", a very common warm-up question.

## 🏠 Real-life example

Think of **buying mangoes at the market to sell at school** during one week.

Each day the mango price changes. You can buy on one day and sell on a later day. You keep a note: **"cheapest price I've seen so far this week"**. Each new day, you ask: "If I had bought on that cheapest day and sold today, how much would I make?"

- The **daily prices** = the array.
- The **"cheapest so far" note** = `minPrice`.
- **"How much if I sell today?"** = `today − minPrice`.
- The **best answer in your diary** = `best`.

You can't sell before you buy, so you only ever compare today with **earlier** days.

## 🧑‍💻 Code example

Save as `stock.js` and run `node stock.js`.

```js
// Problem: buy one day, sell a later day, get the biggest profit
function maxProfitBrute(prices) {                  // brute force: try every buy/sell pair
  let best = 0;                                    // 0 = don't trade at all
  for (let buy = 0; buy < prices.length; buy++) {  // each buy day
    for (let sell = buy + 1; sell < prices.length; sell++) { // each later sell day
      best = Math.max(best, prices[sell] - prices[buy]); // profit of this pair
    }                                              // end of inner loop
  }                                                // end of outer loop
  return best;                                     // biggest profit
}                                                  // end of maxProfitBrute

function maxProfit(prices) {                       // one pass: track the cheapest day so far
  let minPrice = Infinity;                         // cheapest price seen so far
  let best = 0;                                    // best profit so far
  for (const p of prices) {                        // walk through the days once
    minPrice = Math.min(minPrice, p);              // is today the cheapest day to buy?
    best = Math.max(best, p - minPrice);           // profit if we sell today
  }                                                // end of loop
  return best;                                     // biggest profit
}                                                  // end of maxProfit

const prices = [7, 1, 5, 3, 6, 4];                 // price on each day
console.log(maxProfitBrute(prices));               // 5
console.log(maxProfit(prices));                    // 5 (buy at 1, sell at 6)
console.log(maxProfit([7, 6, 4, 3, 1]));           // 0 (price only falls → don't trade)
```

**Output:**

```text
5
5
0
```

**Way 1, brute force:** try every buy day with every later sell day. **O(n²)** time, O(1) space.

**Way 2, one pass:** track the cheapest price so far. **O(n)** time, O(1) space.

**Dry run** of Way 2 on `[7, 1, 5, 3, 6, 4]`:

| day price | minPrice | profit today | best |
|---|---|---|---|
| 7 | 7 | 0 | 0 |
| 1 | 1 | 0 | 0 |
| 5 | 1 | 4 | 4 |
| 3 | 1 | 2 | 4 |
| 6 | 1 | **5** | **5** |
| 4 | 1 | 3 | 5 |

## 🔍 Deeper version

**Why one pass is enough:** the best sale on day `i` always buys at the **lowest price before day i**. So you only need to remember one number, the minimum so far, not every earlier day.

**Array-methods version** (shorter, same idea):

```js
const maxProfitReduce = (prices) =>
  prices.reduce(                                  // walk once, carrying a small state object
    (s, p) => ({                                  // s = { min, best } from the previous day
      min: Math.min(s.min, p),                    // cheapest price so far
      best: Math.max(s.best, p - Math.min(s.min, p)), // best profit so far
    }),
    { min: Infinity, best: 0 },                   // start: no price seen, no profit
  ).best;                                         // the answer
```

The plain loop is easier to read and explain in an interview.

**Related variations:**
- **Stock II** (many trades allowed): add every rise, `price[i] − price[i−1]` when it's positive.
- **Stock with cooldown or fee:** dynamic programming with "holding" and "not holding" states.
- **Kadane connection:** turn prices into daily changes `[−6, 4, −2, 3, −2]`. The max subarray sum (5) is the answer. See [Kadane's algorithm](topic:dsa/pattern-kadane).

## 🎯 Why do we use it?

It tests whether you can turn a "check every pair" idea into **one pass with a remembered value**. The same skill shows up in many real tasks, like "the largest jump in a metric since the last low point" in monitoring data.

## ⚠️ Common mistakes

- **Returning `max − min` of the whole array.** The max might come **before** the min, which isn't a legal trade.
- **Starting `best` at `-Infinity`.** If prices only fall, you'd return a negative profit. The answer should be 0 (don't trade).
- **Updating the minimum after computing profit with a stale min.** The order inside the loop matters less here, but say it clearly when you explain.
- **Forgetting empty or one-day input.** With no possible trade, return 0.

## 🗣️ How to answer in an interview

> "The simple way is to try every buy day with every later sell day, which is O(n²). Better: I walk through the prices once and remember the cheapest price so far. On each day, I calculate the profit if I sold today, today minus the cheapest so far, and keep the best. If prices only fall, the best stays 0. That's O(n) time and O(1) space. It's the same 'best so far' idea as Kadane's algorithm."

## 🔁 Follow-up questions

### What if you can buy and sell many times?

Add up every price rise between two days in a row. Each upward step is profit you can take. That's still O(n).

### How would you also return the buy and sell days?

Keep `minDay` when you update the minimum. When `best` improves, save `buyDay = minDay` and `sellDay = today`.

### Why is the answer 0 and not negative when prices only fall?

You're allowed to not trade at all, which gives 0 profit. A loss is never the best choice.

### Can you solve it with array methods?

Yes, with `reduce` carrying `{ min, best }`. But the loop version is clearer to explain on a whiteboard.

## ✅ Quick check

### 1. What is the answer for `[3, 8, 2, 5]`?

:::answer
**5.** Buy at 3, sell at 8. Buying at 2 and selling at 5 gives only 3.
:::

### 2. Why is `Math.max(...prices) − Math.min(...prices)` wrong for `[9, 1, 5]`?

:::answer
It gives 9 − 1 = **8**, but the 9 comes before the 1, so you can't buy at 1 and sell at 9. The right answer is **4** (buy at 1, sell at 5).
:::
