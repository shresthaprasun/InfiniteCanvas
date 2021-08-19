// // worker.js

// // We alias self to ctx and give it our newly created type
// const ctx: Worker = self as any;

// class SieveOfEratosthenes {

//     // This is the logic for giving us back the primes up to a given number
//     calculate(limit: number) {

//       const sieve = [];
//       const primes: number[] = [];
//       let k;
//       let l;

//       sieve[1] = false;
//       for (k = 2; k <= limit; k += 1) {
//         sieve[k] = true;
//       }

//       for (k = 2; k * k <= limit; k += 1) {
//         if (sieve[k] !== true) {
//           continue;
//         }
//         for (l = k * k; l <= limit; l += k) {
//           sieve[l] = false;
//         }
//       }

//       sieve.forEach(function (value, key) {
//         if (value) {
//           this.push(key);
//         }
//       }, primes);

//       return primes;

//     }

// }

// // Setup a new prime sieve once on instancation
// const sieve = new SieveOfEratosthenes();

// // We send a message back to the main thread
// ctx.addEventListener("message", (event) => {

//     // Get the limit from the event data
//     const limit = event.data.limit;

//     // Calculate the primes
//     const primes = sieve.calculate(limit);

//     // Send the primes back to the main thread
//     ctx.postMessage({ primes });
// });