export function selectionStore() {
	let selectedIds = $state<string[]>([]);

	function select(id: string) {
		selectedIds = [id];
	}

	function toggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function clear() {
		selectedIds = [];
	}

	function isSelected(id: string): boolean {
		return selectedIds.includes(id);
	}

	return {
		get selectedIds() {
			return selectedIds;
		},
		select,
		toggleSelect,
		clear,
		isSelected,
	};
}
