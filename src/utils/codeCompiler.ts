// Import ALL source files as raw text at build time
const srcFiles = import.meta.glob('/src/**/*.{ts,tsx,css,js,jsx,json,md}', { query: '?raw', eager: true });
const supabaseFiles = import.meta.glob('/supabase/**/*.{ts,tsx,js,json,toml,sql,md}', { query: '?raw', eager: true });
const publicFiles = import.meta.glob('/public/**/*.{html,css,js,json,xml,txt,svg,webmanifest}', { query: '?raw', eager: true });
const rootConfigs = import.meta.glob('/{vite.config.ts,tailwind.config.ts,tsconfig.json,tsconfig.app.json,tsconfig.node.json,index.html,components.json,postcss.config.js,eslint.config.js,package.json,README.md,EXAVY_COMPLETE_CODE.md}', { query: '?raw', eager: true });

function extractRaw(mod: unknown): string {
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod === 'object' && 'default' in mod) return (mod as { default: string }).default;
  return '';
}

export function compileAllCode(): string {
  const date = new Date().toLocaleDateString('fr-FR');
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('                         EXAVY - CODE SOURCE COMPLET');
  lines.push(`                        Généré le ${date}`);
  lines.push('='.repeat(80));
  lines.push('');
  lines.push('Ce document contient l\'ensemble du code source de l\'application EXAVY.');
  lines.push('Application développée avec React, TypeScript, Tailwind CSS et Supabase.');
  lines.push('DOCUMENT STRICTEMENT CONFIDENTIEL.');
  lines.push('');

  const sections: { title: string; files: Record<string, unknown> }[] = [
    { title: 'FICHIERS DE CONFIGURATION (racine)', files: rootConfigs },
    { title: 'CODE SOURCE (src/)', files: srcFiles },
    { title: 'FICHIERS PUBLICS (public/)', files: publicFiles },
    { title: 'SUPABASE (config, migrations, functions)', files: supabaseFiles },
  ];

  for (const section of sections) {
    lines.push('');
    lines.push('='.repeat(80));
    lines.push(`  ${section.title}`);
    lines.push('='.repeat(80));
    lines.push('');

    const sortedPaths = Object.keys(section.files).sort();
    for (const filePath of sortedPaths) {
      const content = extractRaw(section.files[filePath]);
      // Clean path: remove leading /
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push(`--- ${cleanPath} ---`);
      lines.push('-'.repeat(80));
      lines.push('');
      lines.push(content.trimEnd());
      lines.push('');
    }
  }

  lines.push('');
  lines.push('='.repeat(80));
  lines.push('                              FIN DU DOCUMENT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`EXAVY © ${new Date().getFullYear()} - AVY DIGITAL BUSINESS`);
  lines.push('Tous droits réservés.');
  lines.push('Contact : avydigitalbusiness@gmail.com');

  return lines.join('\n');
}
