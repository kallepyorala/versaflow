import type { Agent } from '@/types';
import { ChatView } from '@/components/chat/ChatView';

export function AgentDetail({ agent }: { agent: Agent; animating: boolean }) {
  return <ChatView agentKey={agent.color} />;
}
