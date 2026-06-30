import React, { useState } from "react";
import { Link } from "react-router-dom";

const AI_PROMPT_TEXT = `You are an expert database architect generating Chen Code for a custom Chen ER Diagram renderer.

Return ONLY raw Chen Code.

Do NOT use Markdown.
Do NOT wrap output in code fences.
Do NOT include explanations, comments (unless requested), headings, or extra text.
Do NOT invent syntax.
Use CamelCase or underscores for all identifiers.

──────────────────────────────
Supported Syntax
──────────────────────────────

Strong Entity

entity EntityName

Weak Entity

weak_entity WeakEntityName

Attributes

attr ParentName AttributeName [Flags]

Flags

PK   = Primary Key
PPK  = Partial Key (Weak Entity Key)
MV   = Multivalued Attribute
DER  = Derived Attribute

Composite Attributes

attr Employee Name
attr Name FirstName
attr Name MiddleName
attr Name LastName

Relationship Attributes

rel Employee M WorksOn N Project PARTIAL PARTIAL

attr WorksOn StartDate
attr WorksOn Hours
attr WorksOn Role

Relationships

rel Entity1 Card1 RelationshipName Card2 Entity2 Participation1 Participation2

Identifying Relationships

ident_rel Entity1 Card1 RelationshipName Card2 WeakEntity Participation1 Participation2

Generalization / Specialization

isa ParentEntity Type Child1 Child2 ...

Supported ISA Types

d  = Disjoint + Partial
o  = Overlap + Partial
dt = Disjoint + Total
dp = Disjoint + Partial
ot = Overlap + Total
op = Overlap + Partial

Allowed Cardinalities

1
M
N
_

Allowed Participation

TOTAL
PARTIAL

──────────────────────────────
Supported Chen Features
──────────────────────────────

✓ Strong Entities
✓ Weak Entities
✓ Regular Attributes
✓ Composite Attributes
✓ Multivalued Attributes
✓ Derived Attributes
✓ Primary Keys
✓ Partial Keys
✓ Regular Relationships
✓ Identifying Relationships
✓ Relationship Attributes
✓ Recursive Relationships
✓ Multiple Relationships Between Same Entities
✓ Cardinality
✓ Total Participation
✓ Partial Participation
✓ ISA Hierarchies
✓ Disjoint / Overlap Constraints
✓ Total / Partial Specialization

──────────────────────────────
Rules
──────────────────────────────

1. Declare every entity or weak_entity before using it.

2. Every entity should have at least one primary key.

3. Every weak entity should have a partial key (PPK).

4. Relationship attributes must use the relationship name as ParentName.

5. Composite attributes must use the parent attribute as ParentName.

6. Recursive relationships are allowed.

Example

rel Employee 1 Manages M Employee TOTAL PARTIAL

7. Multiple relationships between the same entities are allowed.

Example

rel Employee 1 WorksIn M Department PARTIAL PARTIAL

rel Employee 1 Manages M Department PARTIAL PARTIAL

8. Prefer advanced Chen notation whenever it accurately represents the domain.

Use when appropriate:

• Weak Entities
• Identifying Relationships
• Composite Attributes
• Multivalued Attributes
• Derived Attributes
• Relationship Attributes
• Recursive Relationships
• Multiple Relationships
• ISA Hierarchies
• Total Participation
• Partial Participation

9. Never invent unsupported syntax.

10. Return ONLY Chen Code.

Generate Chen Code for this scenario:
[INSERT YOUR SCENARIO HERE]`;

export default function DocumentationPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <Link
          to="/"
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
        >
          <span>&larr;</span> <span>Back to Editor</span>
        </Link>

        <div className="bg-slate-900 dark:bg-slate-900/50 border dark:border-slate-800 text-white rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors duration-300">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">
              Chen Code Editor Docs{" "}
              <img
                src="/logo.png"
                alt="Chen Code Editor"
                className="inline-block ml-2 w-32 h-16"
              />
            </h1>
            <p className="text-slate-300 text-sm">
              The official guide and AI-prompt generator for your ER diagrams.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md ${
              copied
                ? "bg-green-600 text-white shadow-green-600/30"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
            }`}
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy AI Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* HOW TO USE SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 w-8 h-8 flex items-center justify-center rounded-full text-sm">
              💡
            </span>
            How to Use with AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800 relative transition-colors duration-300">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white dark:border-slate-900">
                1
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">
                Copy the Prompt
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Click the blue button above to copy the strict syntax
                instructions to your clipboard.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800 relative transition-colors duration-300">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white dark:border-slate-900">
                2
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">
                Paste in LLM
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Paste the text into Gemini, ChatGPT, or Claude. Replace{" "}
                <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">
                  [INSERT YOUR SCENARIO HERE]
                </code>{" "}
                with your requirements.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800 relative transition-colors duration-300">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-white dark:border-slate-900">
                3
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">
                Render Diagram
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Paste the generated code into the{" "}
                <strong>Chen Code Editor</strong> to visualize the diagram
                instantly.
              </p>
            </div>
          </div>
        </div>

        {/* SYNTAX REFERENCE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Manual Syntax Reference
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 border-l-4 border-blue-500 pl-3">
                Entities & Attributes
              </h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`entity Student
weak_entity Guardian

attr Student StudentID PK
attr Guardian GuardianID PPK
attr Student Phone MV
attr Student Age DER

// Composite Attribute
attr Student Name
attr Name FirstName
attr Name LastName`}
                </code>
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 border-l-4 border-purple-500 pl-3">
                Relationships (with Cardinality, Participation & Attributes)
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Format:{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-200">
                  rel [E1] [Card1] [Name] [Card2] [E2] [Tot1] [Tot2]
                </code>
              </p>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`// 1:M Relationship (Department to Employees) with total participation
rel Department 1 Employs M Employee TOTAL PARTIAL

// Relationship Attribute
attr Employs StartDate

// Identifying Relationship (Employee to Weak Entity Dependent)
ident_rel Employee 1 Has N Dependent PARTIAL TOTAL

// Recursive Relationship (Entity to itself)
rel Employee 1 Manages M Employee PARTIAL PARTIAL

// Multiple Relationships between same entities
rel Employee 1 WorksIn N Department PARTIAL PARTIAL
rel Employee 1 Leads N Department PARTIAL PARTIAL`}
                </code>
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 border-l-4 border-rose-500 pl-3">
                Generalization (ISA)
              </h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`entity Account
entity Savings
entity Checking

isa Account d Savings Checking`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
