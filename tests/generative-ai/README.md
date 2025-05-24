# Generative AI Demo Test Suite

This test suite ensures the generative AI demo functions correctly across text generation, image generation, error handling, and performance scenarios.

## Prerequisites

1. Development server running on port 3001
2. Valid OpenAI API key in environment variables
3. Node.js and npm installed

## Test Modules

### 1. Text Generation Tests (`test-text-generation.ts`)
- Basic prompt testing (haiku, explanations, stories, code)
- Temperature variations (0, 0.5, 0.7, 1.0)
- Max token variations (50, 200, 400, 800)
- Edge cases (empty, whitespace, special characters, unicode)
- Invalid parameter handling

### 2. Image Generation Tests (`test-image-generation.ts`)
- Basic image generation
- Negative prompt functionality
- Different image sizes (1024x1024, 1792x1024, 1024x1792)
- Image URL validation
- Edge cases and error scenarios

### 3. Error Handling Tests (`test-error-handling.ts`)
- Malformed request handling
- Invalid JSON parsing
- Missing required fields
- Invalid parameter types
- Rate limiting detection
- Content validation

### 4. Performance Tests (`test-performance.ts`)
- Response time measurements
- Concurrent request handling
- Caching behavior
- Performance vs output length correlation

## Running Tests

### Run All Tests
```bash
cd tests/generative-ai
npx tsx run-all-tests.ts
```

### Run Individual Test Modules
```bash
# Text generation only
npx tsx test-text-generation.ts

# Image generation only
npx tsx test-image-generation.ts

# Error handling only
npx tsx test-error-handling.ts

# Performance only
npx tsx test-performance.ts
```

### Configuration
Tests use environment variables and defaults from `test-config.ts`:
- `API_URL`: Default `http://localhost:3001`
- Timeout: 30 seconds for AI generation
- Retry attempts: 2 with 2-second delay

## Expected Results

### Success Criteria
- Text generation: Should complete in < 5 seconds
- Image generation: Should complete in < 15 seconds
- Error handling: All invalid inputs should return appropriate errors
- Performance: Consistent response times with < 20% variance

### Common Issues

1. **API Key Missing**
   - Error: "OpenAI API error"
   - Solution: Ensure `OPENAI_API_KEY` is set in environment

2. **Rate Limiting**
   - Error: "429 Too Many Requests"
   - Solution: Add delays between tests or upgrade API plan

3. **Timeout Errors**
   - Error: "The operation was aborted"
   - Solution: Increase timeout in test-config.ts or check network

4. **Server Not Running**
   - Error: "fetch failed"
   - Solution: Start dev server with `npm run dev`

## Interpreting Results

### Text Generation
- ✅ Pass: Returns non-empty text string
- ❌ Fail: Missing text field or API error

### Image Generation
- ✅ Pass: Returns valid image URL that resolves
- ❌ Fail: Missing imageUrl or invalid URL

### Error Handling
- ✅ Pass: Returns expected error for invalid input
- ❌ Fail: Accepts invalid input without error

### Performance
- Look for consistency in response times
- Check if concurrent requests maintain success rate
- Monitor for performance degradation with larger outputs

## Extending Tests

To add new test cases:

1. Add test prompts to `TEST_PROMPTS` in `test-config.ts`
2. Create test functions following the existing pattern
3. Include new tests in the appropriate module
4. Update this README with new test descriptions

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Generative AI Tests
  run: |
    npm run dev &
    sleep 10
    cd tests/generative-ai
    npx tsx run-all-tests.ts
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Troubleshooting

### Debug Mode
Set `DEBUG=true` environment variable for verbose logging:
```bash
DEBUG=true npx tsx run-all-tests.ts
```

### Check API Health
```bash
curl -X POST http://localhost:3001/api/generative-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","type":"text","maxTokens":10}'
```

### View Server Logs
Check `dev.log` in the project root for server-side errors.