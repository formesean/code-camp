"use client"

import { useState, useMemo } from "react"
import Editor from "@monaco-editor/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Button } from "~/components/ui/button"
import { toast } from "sonner"

const LANGS = ["C", "C++", "Java", "Python"] as const
type Lang = (typeof LANGS)[number]

const templates: Record<Lang, string> = {
  "C": '# Write your solution in C\n#include <stdio.h>\n\nint main(){\n  // TODO\n  printf("Ready\\n");\n  return 0;\n}\n',
  "C++": '// Write your solution in C++\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  // TODO\n  cout << "Ready" << "\\n";\n  return 0;\n}\n',
  "Java": '/* Write your solution in Java */\nimport java.io.*;\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    // TODO\n    System.out.println("Ready");\n  }\n}\n',
  "Python": "# Write your solution in Python\ndef solve():\n    pass\n\nprint('Ready')\n",
}
export function EditorPane({
  onSubmit,
}: {
  onSubmit: (code: string, language: string) => void
}) {
  const [lang, setLang] = useState<Lang>("Python")
  const [code, setCode] = useState<string>(templates["Python"])


  const monacoLang = useMemo(() => {
    if (lang === "C++") return "cpp"
    if (lang === "C") return "cpp" // fallback: use C++ mode for C highlighting
    if (lang === "Java") return "java"
    return "python"
  }, [lang])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <Select
          value={lang}
          onValueChange={(v: Lang) => {
            setLang(v)
            setCode(templates[v])
          }}
        >
          <SelectTrigger className="w-40 hover:cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGS.map((l) => (
              <SelectItem key={l} value={l} className="hover:cursor-pointer">
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button className="hover:cursor-pointer" variant="outline" onClick={() => toast("Run is not implemented in frontend demo.")}>
            Run
          </Button>
          <Button
            onClick={() => {
              onSubmit(code, lang)
            }}
            className="hover:cursor-pointer"
          >
            Submit
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={monacoLang}
          language={monacoLang}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  )
}
