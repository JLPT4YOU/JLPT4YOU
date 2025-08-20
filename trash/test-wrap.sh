#!/bin/bash
file="test-console-sample.tsx"
temp_file="${file}.tmp"
modified=false

while IFS= read -r line; do
    if [[ "$line" =~ console\.(log|error|warn|info|debug|trace) ]]; then
        if [[ "$line" =~ "process.env.NODE_ENV" ]] || [[ "$line" =~ ^[[:space:]]*// ]] || [[ "$line" =~ ^[[:space:]]*\* ]]; then
            echo "$line" >> "$temp_file"
        else
            indent=$(echo "$line" | sed 's/[^ ].*//')
            console_statement=$(echo "$line" | sed 's/^[[:space:]]*//')
            
            if [[ "$line" =~ console\.(error|warn) ]]; then
                echo "$line" >> "$temp_file"
            else
                echo "${indent}if (process.env.NODE_ENV === 'development') {" >> "$temp_file"
                echo "${indent}  $console_statement" >> "$temp_file"
                echo "${indent}}" >> "$temp_file"
                modified=true
            fi
        fi
    else
        echo "$line" >> "$temp_file"
    fi
done < "$file"

if [ "$modified" = true ]; then
    mv "$temp_file" "$file"
    echo "✅ File modified"
else
    rm -f "$temp_file"
    echo "❌ No changes made"
fi
