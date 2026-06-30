import { RevampAgentPanel } from "../../../-components/revamp-agent-panel";
import { SectionBase as RightSectionBase } from "../shared/section-base";

export function RevampSectionBuilder() {
	return (
		<RightSectionBase type="revamp">
			<RevampAgentPanel />
		</RightSectionBase>
	);
}
