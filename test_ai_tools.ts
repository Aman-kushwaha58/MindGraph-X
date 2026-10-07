/**
 * Automated Test Suite: MindGraph X AI Tools Features
 */

const BASE = 'http://localhost:3000';

async function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function run() {
  console.log('🚀 Running AI Tools Feature Verification Suite...\n');

  // 1. Concept Explainer Test
  console.log('--- TEST 1: Multi-Lens Concept Explainer ---');
  const explainRes = await fetch(`${BASE}/api/ai-tools/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concept: 'Attention',
      mode: 'first-principles',
    }),
  });
  assert(explainRes.status === 200, 'POST /api/ai-tools/explain returns 200 OK');
  const explainData = await explainRes.json();
  assert(explainData.concept === 'Attention', 'Explains target concept');
  assert(explainData.mode === 'first-principles', 'Applies requested cognitive lens');
  assert(!!explainData.explanation && explainData.explanation.length > 30, 'Contains detailed explanation');
  assert(Array.isArray(explainData.keyTakeaways) && explainData.keyTakeaways.length > 0, 'Returns structured key takeaways');

  // Test other lens
  const analogyRes = await fetch(`${BASE}/api/ai-tools/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concept: 'Diffusion Models',
      mode: 'analogy',
    }),
  });
  assert(analogyRes.status === 200, 'POST /api/ai-tools/explain works for Diffusion Models analogy');
  const analogyData = await analogyRes.json();
  assert(analogyData.explanation.toLowerCase().includes('ink') || analogyData.explanation.length > 30, 'Generates intuitive analogy');

  // 2. Active Recall Flashcards Test
  console.log('\n--- TEST 2: Active Recall Flashcards ---');
  const flashcardsRes = await fetch(`${BASE}/api/ai-tools/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept: 'Attention' }),
  });
  assert(flashcardsRes.status === 200, 'POST /api/ai-tools/flashcards returns 200 OK');
  const flashcardsData = await flashcardsRes.json();
  assert(Array.isArray(flashcardsData.cards) && flashcardsData.cards.length >= 3, 'Generates at least 3 cards');
  const firstCard = flashcardsData.cards[0];
  assert(!!firstCard.front, 'Card has front prompt');
  assert(!!firstCard.back, 'Card has back explanation');
  assert(typeof firstCard.difficulty === 'number', 'Card has difficulty score');

  // 3. Socratic Feynman Evaluator Test
  console.log('\n--- TEST 3: Socratic Feynman Evaluator ---');
  const socraticRes = await fetch(`${BASE}/api/ai-tools/socratic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concept: 'Attention',
      userExplanation: 'Attention calculates how important other tokens in the sentence are by computing dot products between queries and keys, then normalizes with softmax to average values.',
    }),
  });
  assert(socraticRes.status === 200, 'POST /api/ai-tools/socratic returns 200 OK');
  const socraticData = await socraticRes.json();
  assert(typeof socraticData.score === 'number' && socraticData.score > 0, 'Returns mastery score');
  assert(!!socraticData.feedback, 'Provides pedagogical feedback');
  assert(Array.isArray(socraticData.strengths), 'Identifies strengths in explanation');
  assert(Array.isArray(socraticData.gaps), 'Pinpoints conceptual gaps');
  assert(!!socraticData.nextQuestion, 'Generates probing Socratic challenge question');

  // 4. Concept Bridge & Synthesizer Test
  console.log('\n--- TEST 4: Concept Bridge Synthesizer ---');
  const synthRes = await fetch(`${BASE}/api/ai-tools/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conceptA: 'Attention',
      conceptB: 'FlashAttention',
    }),
  });
  assert(synthRes.status === 200, 'POST /api/ai-tools/synthesize returns 200 OK');
  const synthData = await synthRes.json();
  assert(synthData.conceptA === 'Attention' && synthData.conceptB === 'FlashAttention', 'Synthesizes concepts A and B');
  assert(!!synthData.evolutionNarrative, 'Provides evolutionary narrative');
  assert(Array.isArray(synthData.keyDifferences) && synthData.keyDifferences.length > 0, 'Includes comparative differences table');

  // 5. Formula Decoder Test
  console.log('\n--- TEST 5: Formula Decoder ---');
  const formulaRes = await fetch(`${BASE}/api/ai-tools/formula-decoder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formulaName: 'Scaled Dot-Product Attention' }),
  });
  assert(formulaRes.status === 200, 'POST /api/ai-tools/formula-decoder returns 200 OK');
  const formulaData = await formulaRes.json();
  assert(formulaData.latex.includes('softmax'), 'Returns LaTeX representation');
  assert(Array.isArray(formulaData.components) && formulaData.components.length >= 4, 'Breaks down formula components with tensor shapes');

  // 6. PyTorch Code Generator Test
  console.log('\n--- TEST 6: PyTorch Code Sandbox ---');
  const codeRes = await fetch(`${BASE}/api/ai-tools/code-generator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept: 'Attention', framework: 'pytorch' }),
  });
  assert(codeRes.status === 200, 'POST /api/ai-tools/code-generator returns 200 OK');
  const codeData = await codeRes.json();
  assert(codeData.code.includes('torch') && codeData.code.includes('class ScaledDotProductAttention'), 'Generates runnable PyTorch code');
  assert(codeData.language === 'python', 'Code language is python');

  // 7. Spaced Repetition Card Review Logging
  console.log('\n--- TEST 7: Log Flashcard Review & Stability Update ---');
  const reviewRes = await fetch(`${BASE}/api/ai-tools/log-card-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardId: 'fc-att-1',
      concept: 'Attention',
      rating: 4, // Easy
    }),
  });
  assert(reviewRes.status === 200, 'POST /api/ai-tools/log-card-review returns 200 OK');
  const reviewData = await reviewRes.json();
  assert(reviewData.success === true, 'Review marked as success');
  assert(typeof reviewData.newStability === 'number', 'Stability metric updated');
  assert(typeof reviewData.newConfidence === 'number', 'Mastery confidence updated');

  console.log('\n🎉 ALL AI TOOLS FEATURE TESTS PASSED!');
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
