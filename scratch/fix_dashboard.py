
file_path = r'c:\Users\pande\Desktop\DS\client\src\pages\AdminDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_badge = [
    '                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}>\n',
    '                    <currentStatus.icon className="w-3 h-3" />\n',
    '                    <span>{doc.status || \'Draft\'}</span>\n',
    '                </div>\n'
]

# line numbers 686 to 697 (1-indexed) are 685 to 696 (0-indexed)
lines[685:697] = new_badge

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Replacement complete')
