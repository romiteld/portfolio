# Interactive Agents Demo Test Suite

Comprehensive test suite for the Interactive Agents demo, ensuring all agent functionality, goal processing, and collaborative features work correctly.

## Prerequisites

1. Development server running on port 3001
2. Valid OpenAI API key in environment variables
3. Node.js and npm installed

## Test Modules

### 1. Agent Functionality Tests (`test-agent-functionality.ts`)
- Single agent responses
- Multi-agent collaboration
- Full team coordination
- Context passing between agents
- Agent response validation

### 2. Goal Processing Tests (`test-goal-processing.ts`)
- Simple goal understanding
- Complex goal handling
- Edge case goals (empty, unicode, special chars)
- Goal interpretation quality
- Response relevance checking

### 3. Error Handling Tests (`test-error-handling.ts`)
- Input validation
- Malformed request handling
- API key verification
- Timeout management
- Rate limiting detection

### 4. Performance Tests (`test-performance.ts`)
- Scalability with increasing agents
- Concurrent request handling
- Response consistency
- Memory and context handling
- Performance degradation analysis

### 5. UI Integration Tests (`test-ui-integration.ts`)
- Page loading verification
- User workflow simulation
- State management
- Agent selection/deselection
- Visual element verification

## Running Tests

### Run All Tests
```bash
cd tests/interactive-agents
npx tsx run-all-tests.ts
```

### Run Individual Test Modules
```bash
# Agent functionality
npx tsx test-agent-functionality.ts

# Goal processing
npx tsx test-goal-processing.ts

# Error handling
npx tsx test-error-handling.ts

# Performance
npx tsx test-performance.ts

# UI integration
npx tsx test-ui-integration.ts
```

## Test Configuration

Edit `test-config.ts` to customize:
- `API_URL`: Default `http://localhost:3001`
- `TIMEOUT`: 35 seconds (API maxDuration is 30s)
- Available agents and their configurations
- Test goals and scenarios

## Understanding Test Results

### Agent Functionality
- ✅ Pass: All requested agents respond with valid content
- ❌ Fail: Missing agents or invalid response format

### Goal Processing
- ✅ Pass: Goals interpreted correctly with relevant responses
- ❌ Fail: Generic responses or goal misunderstanding

### Error Handling
- ✅ Pass: Invalid inputs properly rejected
- ❌ Fail: Accepts invalid data or crashes

### Performance
- Look for response time trends as agents increase
- Check concurrent processing benefits
- Monitor consistency across runs

### UI Integration
- Verifies demo page functionality
- Tests common user workflows
- Checks state management

## Expected Performance

| Metric | Expected | Warning Threshold |
|--------|----------|------------------|
| Single agent response | < 3s | > 5s |
| 6-agent team response | < 15s | > 20s |
| Success rate | > 95% | < 90% |
| Context awareness | Yes | No |

## Common Issues

### 1. API Key Missing
```
Error: OPENAI_API_KEY environment variable not set
```
**Solution**: Set the environment variable with your OpenAI API key

### 2. Timeout Errors
```
Error: The operation was aborted
```
**Solution**: 
- Check network connection
- Reduce number of agents
- Increase timeout in test-config.ts

### 3. Rate Limiting
```
Status: 429 Too Many Requests
```
**Solution**: Add delays between tests or upgrade API plan

### 4. Context Not Detected
**Issue**: Agents don't reference each other's work
**Solution**: This is expected behavior if agents process independently

## Interpreting Agent Responses

### Good Response Characteristics
- Relevant to the goal
- Appropriate length (10-5000 chars)
- Agent-specific expertise shown
- Builds on previous agents (when applicable)

### Poor Response Characteristics
- Generic or vague
- Too short or too long
- Doesn't address the goal
- Contains errors or inconsistencies

## Extending Tests

To add new test scenarios:

1. **Add new goals** in `test-config.ts`:
```typescript
TEST_GOALS.custom = {
  newScenario: 'Your custom goal here'
};
```

2. **Add new agent combinations**:
```typescript
AGENT_COMBINATIONS.custom = [
  ['agent1', 'agent2', 'agent3']
];
```

3. **Create custom test functions** following the pattern in existing test files

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run Interactive Agents Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: |
    npm run dev &
    sleep 10
    cd tests/interactive-agents
    npx tsx run-all-tests.ts
```

## Performance Optimization Tips

1. **Limit concurrent agents** to 3-4 for optimal performance
2. **Use specific goals** for better agent responses
3. **Cache frequently used responses** if implementing in production
4. **Monitor API usage** to avoid rate limits

## Debugging

Enable verbose logging:
```bash
DEBUG=true npx tsx run-all-tests.ts
```

Test specific agent:
```bash
curl -X POST http://localhost:3001/api/interactive-agents \
  -H "Content-Type: application/json" \
  -d '{"goal":"Test","agents":["developer"]}'
```

## Test Metrics

After running tests, review:
- Response time patterns
- Success rates by agent type
- Context awareness detection
- Performance scaling factors