#!/bin/bash
# Fix remaining camelCase names in schema rules

sed -i '' "s/name: 'schemaArticlePresent'/name: 'Schema Article (presence check)'/g" src/rules/schema/articlePresent.ts
sed -i '' "s/name: 'schemaArticleRequired'/name: 'Schema Article (required fields)'/g" src/rules/schema/articleRequired.ts
sed -i '' "s/name: 'schemaBreadcrumb'/name: 'Schema BreadcrumbList'/g" src/rules/schema/breadcrumb.ts
sed -i '' "s/name: 'schemaFaq'/name: 'Schema FAQPage'/g" src/rules/schema/faq.ts
sed -i '' "s/name: 'schemaHowTo'/name: 'Schema HowTo'/g" src/rules/schema/howto.ts
sed -i '' "s/name: 'schemaJobPosting'/name: 'Schema JobPosting'/g" src/rules/schema/jobPosting.ts
sed -i '' "s/name: 'schemaOrganization'/name: 'Schema Organization\/LocalBusiness'/g" src/rules/schema/organization.ts
sed -i '' "s/name: 'schemaProduct'/name: 'Schema Product'/g" src/rules/schema/product.ts
sed -i '' "s/name: 'schemaRecipe'/name: 'Schema Recipe'/g" src/rules/schema/recipe.ts
sed -i '' "s/name: 'schemaVideo'/name: 'Schema VideoObject'/g" src/rules/schema/video.ts

echo "✅ Fixed 10 schema rule names"
