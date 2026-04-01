import type Anthropic from '@anthropic-ai/sdk';

export const chatTools: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the connected GitHub repository. Always read files before suggesting changes so you understand existing code.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'The path to the file relative to the repository root (e.g., "src/index.ts", "package.json")',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories in a path of the connected GitHub repository. Use this to understand the project structure before diving into specific files.',
    input_schema: {
      type: 'object' as const,
      properties: {
        directory: {
          type: 'string',
          description: 'The directory path relative to the repository root (e.g., "src", "tests"). Use "" for root.',
        },
      },
      required: ['directory'],
    },
  },
  {
    name: 'search_code',
    description: 'Search for code patterns, function names, imports, or keywords across the repository. Use this to find where something is defined or used.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query — a keyword, function name, import path, or pattern to find across the codebase.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'suggest_fix',
    description: 'Suggest a code fix by providing the file path and complete new content. The user will see a diff-style view and can choose to apply it. Use this for showing proposed changes before committing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'The file path to create or modify',
        },
        content: {
          type: 'string',
          description: 'The complete file content to write',
        },
        description: {
          type: 'string',
          description: 'Brief description of what this change does and why',
        },
      },
      required: ['file_path', 'content', 'description'],
    },
  },
  {
    name: 'apply_fix',
    description: 'Apply a code fix by creating a new branch, committing the change, and optionally opening a pull request. Use this when the user confirms they want to apply a suggested fix, or for small straightforward fixes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'The file path to create or modify',
        },
        content: {
          type: 'string',
          description: 'The complete file content to write',
        },
        commit_message: {
          type: 'string',
          description: 'The git commit message describing the change',
        },
        create_pr: {
          type: 'boolean',
          description: 'Whether to open a pull request (default: true)',
        },
        pr_title: {
          type: 'string',
          description: 'Pull request title (defaults to commit message)',
        },
        description: {
          type: 'string',
          description: 'Description of what this fix does, for the PR body',
        },
      },
      required: ['file_path', 'content', 'commit_message'],
    },
  },
];
