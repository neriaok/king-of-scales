export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'chore',
        'docs',
        'ci',
        'refactor',
        'style',
        'perf',
        'build',
        'revert',
      ],
    ],
    'body-max-line-length': [1, 'always', 100],
  },
};
