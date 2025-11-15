#!/bin/bash
# Batch update all rules to add 'what' field

# HEAD rules - all test static DOM
for file in v7/src/rules/head/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# HTTP rules - all test HTTP headers/response
for file in v7/src/rules/http/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''http'\'',/' "$file"
  fi
done

# PSI rules - all test PageSpeed Insights
for file in v7/src/rules/google/psi/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''psi'\'',/' "$file"
  fi
done

# GSC rules - all test Google Search Console
for file in v7/src/rules/google/gsc/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''gsc'\'',/' "$file"
  fi
done

# OG rules - all test static DOM (Open Graph meta tags)
for file in v7/src/rules/og/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# SCHEMA rules - all test static DOM (structured data)
for file in v7/src/rules/schema/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# BODY rules - all test static DOM
for file in v7/src/rules/body/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# DOM rules - all test static DOM
for file in v7/src/rules/dom/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# ROBOTS rules - all test static DOM or HTTP
for file in v7/src/rules/robots/*.ts; do
  if ! grep -q "what:" "$file"; then
    # Most robots rules test both HTTP and DOM
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''http'\'',/' "$file"
  fi
done

# SPEED rules - all test static DOM
for file in v7/src/rules/speed/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# URL rules - all test static DOM
for file in v7/src/rules/url/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# A11Y rules - all test static DOM
for file in v7/src/rules/a11y/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# DISCOVER rules - all test static DOM
for file in v7/src/rules/discover/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# GOOGLE rules (non-PSI/GSC) - mixed
for file in v7/src/rules/google/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

# DEBUG rules - static DOM
for file in v7/src/rules/debug/*.ts; do
  if ! grep -q "what:" "$file"; then
    sed -i '' 's/\(enabled: [^,]*,\)/\1\n  what: '\''static'\'',/' "$file"
  fi
done

echo "Updated all rule files with 'what' field"
