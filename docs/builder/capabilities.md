# Capability matrix

Checked against `adapters/quantum-age/adapter.ts` and `fixtures/harbor/adapter.ts`. `tests/unit/capability-matrix.test.ts` asserts the review, forms, and blog flags.

## Quantum Age

Level 2.

- Can create pages: yes
- Can edit articles: yes
- Can edit navigation: yes
- Can use a free canvas: yes
- Can use structured sections: yes
- Can edit the theme: yes
- Can use site components: yes
- Can use forms: yes
- Can use a shared layout: yes
- Can send for review: yes

## Harbor

Level 2.

- Can create pages: yes
- Can edit articles: no
- Can edit navigation: yes
- Can use a free canvas: yes
- Can use structured sections: yes
- Can edit the theme: yes
- Can use site components: yes
- Can use forms: no
- Can use a shared layout: yes
- Can send for review: no

When review is false, Submit for review is hidden. When forms are false, the form catalog item is hidden.
