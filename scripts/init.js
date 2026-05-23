#!/usr/bin/env node

/**
 * init.js - Starter Kit Initializer
 * Sets up multi-agent AI configuration for Laravel + Inertia + React projects.
 * Usage: npm run init
 */

import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Output Helpers ───────────────────────────────────────────────────────────

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

const c = (color, text) => `${C[color]}${text}${C.reset}`;
const log = {
    info: (msg) => console.log(`  ${c('cyan', '>')} ${msg}`),
    ok: (msg) => console.log(`  ${c('green', 'OK')} ${msg}`),
    warn: (msg) => console.log(`  ${c('yellow', '!!')} ${msg}`),
    err: (msg) => console.log(`  ${c('red', 'ERR')} ${msg}`),
    step: (msg) =>
        console.log(`\n${c('bold', c('blue', '>>'))} ${c('bold', msg)}`),
    dim: (msg) => console.log(`     ${c('dim', msg)}`),
};

// ── Paths ────────────────────────────────────────────────────────────────────

const SCRIPT_DIR = __dirname;
const KIT_ROOT = path.dirname(SCRIPT_DIR); // starter-kit root (where AGENTS.md, CONTEXT.md, skills/ live)
const PROJECT_ROOT = process.cwd();

// ── Agent Definitions ────────────────────────────────────────────────────────

const AGENTS = {
    gemini: {
        label: 'Gemini CLI',
        folder: '.gemini',
        key: 'gemini',
        color: 'blue',
    },
    claude: {
        label: 'Claude Code',
        folder: '.claude',
        key: 'claude',
        color: 'magenta',
    },
    github: {
        label: 'GitHub Copilot',
        folder: '.github',
        key: 'github',
        color: 'cyan',
    },
    qoder: {
        label: 'Qoder',
        folder: '.qoder',
        key: 'qoder',
        color: 'yellow',
    },
};

const AGENT_INSTRUCTIONS = {
    gemini: { src: 'AGENTS.md', dst: '.gemini/GEMINI.md' },
    claude: { src: 'AGENTS.md', dst: '.claude/CLAUDE.md' },
    github: { src: 'AGENTS.md', dst: '.github/copilot-instructions.md' },
    qoder: { src: 'AGENTS.md', dst: '.qoder/QODER.md' },
};

const AGENT_SKILLS_TARGET = {
    gemini: '.gemini/skills',
    claude: '.claude/skills',
    github: '.github/skills',
    qoder: '.qoder/skills',
};

const GITIGNORE_ENTRIES = {
    gemini: ['.gemini/GEMINI.md'],
    claude: ['.claude/CLAUDE.md'],
    github: [],
    qoder: ['.qoder/QODER.md'],
};

// Latest agent config formats (April 2026)
const AGENT_CONFIGS = {
    gemini: {
        file: '.gemini/settings.json',
        content: {
            contextFileName: 'GEMINI.md',
            mcpServers: {},
        },
    },
    claude: {
        file: '.claude/settings.json',
        content: {
            permissions: {
                allow: [
                    'Bash(npm run *)',
                    'Bash(npx *)',
                    'Bash(composer *)',
                    'Bash(php artisan *)',
                    'Bash(phpunit *)',
                    'Bash(git *)',
                    'Bash(vendor/bin/*)',
                    'MCP',
                ],
                deny: [],
            },
        },
    },
    github: null,
    qoder: {
        file: '.qoder/settings.json',
        content: {
            mcpServers: {},
        },
    },
};

const DEFAULT_THEMES = [
    { key: 'modern', label: 'Modern - Clean, minimal with neutral tones' },
    { key: 'minimal', label: 'Minimal - Ultra-simple, whitespace-heavy' },
    {
        key: 'elegant',
        label: 'Elegant - Refined, serif accents, muted palette',
    },
    { key: 'bold', label: 'Bold - High contrast, vivid accents' },
    { key: 'corporate', label: 'Corporate - Professional, structured layout' },
    { key: 'playful', label: 'Playful - Rounded elements, vibrant colors' },
];

// ── Utility Functions ────────────────────────────────────────────────────────

function ensureDir(dirPath) {
    const full = path.join(PROJECT_ROOT, dirPath);
    if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
        log.dim(`Created: ${dirPath}`);
    }
}

function copyDirRecursive(src, dst) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const item of fs.readdirSync(src)) {
        const srcItem = path.join(src, item);
        const dstItem = path.join(dst, item);
        if (fs.statSync(srcItem).isDirectory()) {
            copyDirRecursive(srcItem, dstItem);
        } else {
            fs.copyFileSync(srcItem, dstItem);
        }
    }
}

// ── Setup Functions ──────────────────────────────────────────────────────────

function generateAgentDocs(agentKey) {
    const { src, dst } = AGENT_INSTRUCTIONS[agentKey];
    const srcPath = path.join(KIT_ROOT, src);
    const dstPath = path.join(PROJECT_ROOT, dst);

    if (!fs.existsSync(srcPath)) {
        log.warn(`Source file not found: ${src}`);
        return false;
    }

    let content = fs.readFileSync(srcPath, 'utf8');
    if (content.trim().length === 0) {
        log.warn(`${src} is empty, creating placeholder`);
        content = `# ${AGENTS[agentKey].label} Instructions\n\nProject-specific instructions for ${AGENTS[agentKey].label}.\nRefer to CONTEXT.md for project context and guidelines.\n`;
    }

    // Rewrite skills paths for this agent
    content = content.replace(/skills\//g, `.${agentKey}/skills/`);

    // Append instruction to read root CONTEXT.md
    if (!content.includes('CONTEXT.md at the project root')) {
        content += `\n---\n\n**Important:** Always read and follow the project context defined in \`CONTEXT.md\` at the project root before starting any task.\n`;
    }

    ensureDir(path.dirname(dst));
    fs.writeFileSync(dstPath, content);
    log.ok(`Generated ${dst}`);
    return true;
}

function generateContextFile(dst, uiSelection) {
    const srcPath = path.join(KIT_ROOT, 'CONTEXT.md');
    const dstPath = path.join(PROJECT_ROOT, dst);

    if (!fs.existsSync(srcPath)) {
        log.warn('Source file not found: CONTEXT.md');
        return false;
    }

    let content = fs.readFileSync(srcPath, 'utf8');

    if (content.trim().length === 0) {
        content = `# Project Context\n\n## Overview\n\nBrief description of what this project does.\n\n## Design System\n\n## Business Logic / Rules\n\n## Technology Stack\n\n- Laravel 13 (PHP 8.3+)\n- React 19.2, Inertia.js v3\n- Tailwind CSS v4.2\n- Vite 8\n`;
    }

    let designBlock = '';
    if (uiSelection.type === 'template') {
        designBlock = `## Design System\n\n- **Strategy:** Scenario A (Template Conversion)\n- **Source:** \`ui-templates/\` directory.\n- **Strict Instruction:** The project UI MUST strictly follow the HTML/CSS provided in the \`ui-templates/\` directory. Do NOT mix external UI libraries or pre-made themes. Replicate the provided templates perfectly into React/Inertia components. Maintain absolute visual consistency.`;
    } else {
        designBlock = `## Design System\n\n- **Strategy:** Scenario B (Theme Generation)\n- **Selected Theme:** \`${uiSelection.theme}\`\n- **Source:** \`skills/ui-design/themes/${uiSelection.theme}/\`\n- **Strict Instruction:** The project UI MUST be built from scratch strictly following the \`${uiSelection.theme}\` theme defined in \`skills/ui-design/themes/${uiSelection.theme}/SKILL.md\` (or DESIGN.md). Do NOT use any other theme or external templates. All UI elements, spacing, typography, and colors must consistently reflect the \`${uiSelection.theme}\` theme. Maintain absolute visual consistency across the entire app.`;
    }

    const designRegex =
        /## Design System[\s\S]*?(?=## Business Logic \/ Rules)/;
    if (designRegex.test(content)) {
        content = content.replace(designRegex, designBlock + '\n\n');
    } else {
        // Append design block before Business Logic section, or at the end
        const bizLogicIdx = content.indexOf('## Business Logic');
        if (bizLogicIdx !== -1) {
            content =
                content.slice(0, bizLogicIdx) +
                designBlock +
                '\n\n' +
                content.slice(bizLogicIdx);
        } else {
            content += '\n' + designBlock + '\n';
        }
    }

    ensureDir(path.dirname(dst));
    fs.writeFileSync(dstPath, content);
    log.ok(
        `Generated ${dst} [UI: ${uiSelection.type === 'template' ? 'templates' : uiSelection.theme}]`,
    );
    return true;
}

function copySkills(agentKey) {
    const target = AGENT_SKILLS_TARGET[agentKey];
    const skillsDir = path.join(KIT_ROOT, 'skills');

    if (!fs.existsSync(skillsDir)) {
        log.warn('skills/ folder not found, skipping.');
        return;
    }

    ensureDir(target);
    const targetPath = path.join(PROJECT_ROOT, target);

    let count = 0;
    for (const skill of fs.readdirSync(skillsDir)) {
        const srcSkill = path.join(skillsDir, skill);
        const dstSkill = path.join(targetPath, skill);
        if (fs.statSync(srcSkill).isDirectory()) {
            copyDirRecursive(srcSkill, dstSkill);
            count++;
        }
    }

    if (count > 0) {
        log.ok(`Copied ${count} skill(s) to ${target}`);
    } else {
        log.dim('No skills found to copy.');
    }
}

function updateGitignore(agentKey) {
    const entries = GITIGNORE_ENTRIES[agentKey];
    if (!entries || entries.length === 0) return;

    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    let content = fs.existsSync(gitignorePath)
        ? fs.readFileSync(gitignorePath, 'utf8')
        : '';

    const newEntries = entries.filter((e) => !content.includes(e));
    if (newEntries.length > 0) {
        content += `\n# AI agent context files (${agentKey})\n${newEntries.join('\n')}\n`;
        fs.writeFileSync(gitignorePath, content);
        log.ok(
            `Updated .gitignore (+${newEntries.length} entries for ${agentKey})`,
        );
    } else {
        log.dim(`.gitignore already has entries for ${agentKey}`);
    }
}

function writeAgentConfig(agentKey) {
    const cfg = AGENT_CONFIGS[agentKey];
    if (!cfg) return;

    const filePath = path.join(PROJECT_ROOT, cfg.file);
    if (fs.existsSync(filePath)) {
        log.dim(`${cfg.file} already exists, skipping.`);
        return;
    }

    ensureDir(path.dirname(cfg.file));
    fs.writeFileSync(filePath, JSON.stringify(cfg.content, null, 2) + '\n');
    log.ok(`Created config: ${cfg.file}`);
}

function installPersistentMemory() {
    try {
        log.info('Installing claude-mem...');
        execSync('npx claude-mem install', {
            stdio: 'inherit',
            cwd: PROJECT_ROOT,
        });
        log.ok('Persistent memory (claude-mem) installed');
    } catch (e) {
        log.err(`Failed to install claude-mem: ${e.message}`);
        log.dim('You can install it manually later: npx claude-mem install');
    }
}

// ── Archive Helper ───────────────────────────────────────────────────────────

function archiveItem(srcRelative, archiveDir) {
    const srcPath = path.join(PROJECT_ROOT, srcRelative);
    const dstPath = path.join(PROJECT_ROOT, archiveDir, srcRelative);

    if (!fs.existsSync(srcPath)) return false;

    ensureDir(path.dirname(dstPath));

    if (fs.statSync(srcPath).isDirectory()) {
        copyDirRecursive(srcPath, dstPath);
        fs.rmSync(srcPath, { recursive: true, force: true });
    } else {
        fs.copyFileSync(srcPath, dstPath);
        fs.unlinkSync(srcPath);
    }

    log.ok(`Moved ${srcRelative} -> ${archiveDir}/${srcRelative}`);
    return true;
}

// ── Interactive Prompts ──────────────────────────────────────────────────────

async function promptProjectName() {
    const defaultName = path.basename(PROJECT_ROOT);
    return input({ message: 'Project name:', default: defaultName });
}

async function selectUIStrategy() {
    const strategy = await select({
        message: 'Select UI Strategy:',
        choices: [
            {
                name: 'Use existing HTML templates (from ui-templates/)',
                value: 'template',
            },
            { name: 'Generate UI from a Theme', value: 'theme' },
        ],
    });

    if (strategy === 'template') {
        return { type: 'template', theme: null };
    }

    // Try loading themes from the filesystem
    const themesDir = path.join(KIT_ROOT, 'skills', 'ui-design', 'themes');
    const themeIndexPath = path.join(themesDir, 'index.json');
    let themeChoices = [];

    // Method 1: Load from index.json
    if (fs.existsSync(themeIndexPath)) {
        try {
            const themes = JSON.parse(fs.readFileSync(themeIndexPath, 'utf8'));
            const keys = Object.keys(themes);
            if (keys.length > 0) {
                themeChoices = keys.map((key) => ({
                    name: themes[key]?.label
                        ? `${key} - ${themes[key].label}`
                        : key,
                    value: key,
                }));
            }
        } catch {
            // Fall through to next method
        }
    }

    // Method 2: Scan theme directories
    if (themeChoices.length === 0 && fs.existsSync(themesDir)) {
        const dirs = fs
            .readdirSync(themesDir)
            .filter((d) => fs.statSync(path.join(themesDir, d)).isDirectory());
        if (dirs.length > 0) {
            themeChoices = dirs.map((d) => ({ name: d, value: d }));
        }
    }

    // Method 3: Use default theme list
    if (themeChoices.length === 0) {
        themeChoices = DEFAULT_THEMES.map((t) => ({
            name: t.label,
            value: t.key,
        }));
    }

    const selectedTheme = await select({
        message: 'Select a theme:',
        choices: themeChoices,
    });

    return { type: 'theme', theme: selectedTheme };
}

async function selectAgents() {
    const agentList = Object.values(AGENTS);
    return checkbox({
        message: 'Select AI Agents to set up:',
        choices: agentList.map((agent) => ({
            name: agent.label,
            value: agent.key,
            checked: false,
        })),
        validate: (values) =>
            values.length > 0 ? true : 'Select at least one agent.',
    });
}

async function promptMemorySetup() {
    return confirm({
        message: 'Set up persistent AI memory (claude-mem)?',
        default: false,
    });
}

async function confirmSummary(
    selectedAgents,
    projectName,
    uiSelection,
    setupMemory,
) {
    console.log();
    console.log(
        c('bold', '  --------------------------------------------------'),
    );
    console.log(c('bold', '  Setup Summary'));
    console.log(
        c('bold', '  --------------------------------------------------'),
    );
    console.log(`  Project:     ${c('bold', projectName)}`);
    console.log(`  Root:        ${c('dim', PROJECT_ROOT)}`);
    console.log(
        `  UI Strategy: ${
            uiSelection.type === 'template'
                ? 'HTML Templates'
                : `Theme: ${c('bold', uiSelection.theme)}`
        }`,
    );
    console.log(
        `  Agents:      ${selectedAgents.map((k) => AGENTS[k].label).join(', ')}`,
    );
    console.log(`  Memory:      ${setupMemory ? 'Yes (claude-mem)' : 'No'}`);
    console.log();

    return confirm({ message: 'Proceed?', default: true });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.clear();
    console.log();
    console.log(c('bold', c('cyan', '  Starter Kit Initializer')));
    console.log(c('dim', '  Multi-Agent AI Project Setup'));
    console.log();

    // Warn if running from inside the starter-kit itself
    if (PROJECT_ROOT === KIT_ROOT) {
        log.info('Running from inside the starter-kit folder.');
        log.info('This is normal for first-time project setup.');
        console.log();

        const cont = await confirm({ message: 'Continue?', default: true });
        if (!cont) process.exit(0);
    }

    // 1. Project name
    const projectName = await promptProjectName();

    // 2. UI Strategy (with working theme selection)
    const uiSelection = await selectUIStrategy();

    // 3. Select agents
    const selectedAgents = await selectAgents();

    // 4. Memory setup
    const setupMemory = await promptMemorySetup();

    // 5. Confirm summary
    const confirmed = await confirmSummary(
        selectedAgents,
        projectName,
        uiSelection,
        setupMemory,
    );
    if (!confirmed) {
        log.warn('Setup cancelled.');
        process.exit(0);
    }

    console.log();

    // 6. Generate root CONTEXT.md (shared across all agents)
    log.step('Generate project context');
    generateContextFile('CONTEXT.md', uiSelection);

    // 7. Setup each selected agent
    for (const agentKey of selectedAgents) {
        const agent = AGENTS[agentKey];
        log.step(`Set up ${c(agent.color, agent.label)}`);

        generateAgentDocs(agentKey);

        copySkills(agentKey);
        updateGitignore(agentKey);
        writeAgentConfig(agentKey);
    }

    // 8. Install persistent memory if selected
    if (setupMemory) {
        log.step('Set up persistent memory');
        installPersistentMemory();
    }

    // 9. Update PRD.md with context reference
    log.step('Finalizing project files');
    const prdPath = path.join(PROJECT_ROOT, 'PRD.md');
    if (fs.existsSync(prdPath)) {
        let prdContent = fs.readFileSync(prdPath, 'utf8');
        if (!prdContent.includes('CONTEXT.md')) {
            prdContent = prdContent.replace(
                /> Fill in the Overview and tasks before starting\./,
                '> Fill in the Overview and tasks before starting.\n> **Context:** Refer to `CONTEXT.md` at the project root for guidelines.',
            );
            fs.writeFileSync(prdPath, prdContent);
            log.ok('Updated PRD.md with context reference');
        }
    }

    // 10. Archive starter-kit template files (move, don't delete)
    log.step('Archiving starter-kit template files');
    const archiveDir = '_archive';
    ensureDir(archiveDir);

    archiveItem('AGENTS.md', archiveDir);
    archiveItem('NEW_PROJECT_GUIDE.md', archiveDir);

    // Move skills/ to _archive/skills/
    const skillsPath = path.join(PROJECT_ROOT, 'skills');
    if (fs.existsSync(skillsPath)) {
        const archiveSkillsPath = path.join(PROJECT_ROOT, archiveDir, 'skills');
        copyDirRecursive(skillsPath, archiveSkillsPath);
        fs.rmSync(skillsPath, { recursive: true, force: true });
        log.ok('Moved skills/ -> _archive/skills/');
    }

    // 11. Clean up unused UI assets
    if (uiSelection.type !== 'template') {
        const uiTemplatesPath = path.join(PROJECT_ROOT, 'ui-templates');
        if (fs.existsSync(uiTemplatesPath)) {
            const archiveUiPath = path.join(
                PROJECT_ROOT,
                archiveDir,
                'ui-templates',
            );
            copyDirRecursive(uiTemplatesPath, archiveUiPath);
            fs.rmSync(uiTemplatesPath, { recursive: true, force: true });
            log.ok('Moved ui-templates/ -> _archive/ui-templates/');
        }

        // Remove unused themes from agent skill folders
        for (const agentKey of selectedAgents) {
            const themesPath = path.join(
                PROJECT_ROOT,
                `.${agentKey}`,
                'skills',
                'ui-design',
                'themes',
            );
            if (fs.existsSync(themesPath)) {
                let removed = 0;
                for (const theme of fs.readdirSync(themesPath)) {
                    if (theme !== uiSelection.theme) {
                        fs.rmSync(path.join(themesPath, theme), {
                            recursive: true,
                            force: true,
                        });
                        removed++;
                    }
                }
                if (removed > 0) {
                    log.dim(
                        `Removed ${removed} unused theme(s) from .${agentKey}/skills/ui-design/themes/`,
                    );
                }
            }
        }
    } else {
        // Template mode: remove ui-design skill from agent folders (not needed)
        for (const agentKey of selectedAgents) {
            const agentUiSkillPath = path.join(
                PROJECT_ROOT,
                `.${agentKey}`,
                'skills',
                'ui-design',
            );
            if (fs.existsSync(agentUiSkillPath)) {
                fs.rmSync(agentUiSkillPath, { recursive: true, force: true });
                log.dim(
                    `Removed unused ui-design skill from .${agentKey}/skills/`,
                );
            }
        }
    }

    // Done
    console.log();
    console.log(c('bold', c('green', '  Setup complete!')));
    console.log();
    console.log(`  Project:     ${c('bold', projectName)}`);
    console.log(
        `  UI Strategy: ${
            uiSelection.type === 'template'
                ? 'HTML Templates'
                : `Theme: ${c('bold', uiSelection.theme)}`
        }`,
    );
    for (const key of selectedAgents) {
        const agent = AGENTS[key];
        console.log(
            `  ${c(agent.color, agent.label)}: ${c('dim', `${agent.folder}/ configured`)}`,
        );
    }
    if (setupMemory) {
        console.log(`  Memory:      ${c('dim', 'claude-mem installed')}`);
    }
    console.log();
    log.dim('Restart your AI agent so the new config takes effect.');
    console.log();
}

main().catch((err) => {
    if (err.name === 'ExitPromptError') process.exit(0);
    log.err(`Unexpected error: ${err.message}`);
    process.exit(1);
});
