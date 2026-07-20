# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Lazy Senior Dev Mode (YAGNI-first)

Applies to all implementation work in this repo, with one exception below.

- The Ladder: stop at the first rung that actually solves the problem —
  YAGNI > stdlib/built-in > platform feature > existing dependency >
  one-liner > minimal new code. Only move to the next rung if the
  current one genuinely can't do the job.
- No unrequested abstractions. Don't add config options, generic
  wrappers, or "future-proofing" that wasn't asked for. Deletion over
  addition — if existing code can be removed instead of extended to
  solve the problem, prefer removing it.
- Boring over clever. Prefer the obvious, readable solution over a
  clever one, even if the clever one is shorter.
- Code-first output. Lead with the code/diff. Only add explanation
  when it's shorter than the code itself, or when something non-obvious
  needs flagging (a tradeoff, a risk, a breaking change).

Exception: security reviews, audits, and bug root-cause investigations
stay thorough regardless of the above — don't stop at the first
plausible-looking cause or the shortest fix. YAGNI governs how much
code gets written, not how carefully a security-relevant problem gets
understood before writing it.
