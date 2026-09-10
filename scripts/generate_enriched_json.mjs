// generate_enriched_json.mjs
import fs from 'fs';

// Load descriptions from scripts/enrich_export.mjs
import { descriptions } from './descriptions_map.mjs';

// Read the prompt's user export or assemble it
const userGroups = JSON.parse(fs.readFileSync('./data/user_groups.json', 'utf-8'));

// Build complete enriched export
// We also populate all categories and stocks flat array
const categories = userGroups.groups.map(g => ({
  id: g.id,
  name: g.name
}));

const stocks = [];
userGroups.groups.forEach(grp => {
  grp.stocks.forEach((st, idx) => {
    const desc = descriptions[st.code] || st.description || "";
    st.description = desc;
    stocks.push({
      id: `${grp.id}_${st.code}`,
      code: st.code,
      name: st.name,
      categoryId: grp.id,
      description: desc,
      createdAt: Date.now() + idx
    });
  });
});

const enrichedExport = {
  version: "Simple-X-Web",
  exportedAt: new Date().toLocaleString('ja-JP'),
  groups: userGroups.groups,
  categories: categories,
  stocks: stocks,
  descriptionsCount: Object.keys(descriptions).length
};

fs.writeFileSync('./public/k-navigator-enriched.json', JSON.stringify(enrichedExport, null, 2), 'utf-8');
console.log('Finished! Total stocks:', stocks.length, 'Total enriched codes:', Object.keys(descriptions).length);
