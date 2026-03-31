# Contributing to RepoPilot

Thanks for helping improve RepoPilot.

## How to Contribute

- Report bugs with clear reproduction steps and expected vs actual behavior.
- Propose enhancements with a concrete developer use case.
- Keep pull requests focused and easy to review.

## Local Setup

```bash
npm install
npm run build
npm test
```

Run the CLI locally:

```bash
npm run start -- analyze .
npm run start -- fix . --dry-run
```

## Pull Request Checklist

- Add or update tests when behavior changes.
- Keep docs aligned (`README.md`, examples, command help).
- Ensure `npm run build` and `npm test` pass.

## License

By contributing, you agree your contributions are licensed under MIT.
