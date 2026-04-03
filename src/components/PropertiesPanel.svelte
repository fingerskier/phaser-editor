<script lang="ts">
	import type { GameObject } from '$lib/types.js';
	import { OBJ_TYPES } from '$lib/constants.js';

	let {
		selectedObject = null,
		onUpdateProperty,
	}: {
		selectedObject: GameObject | null;
		onUpdateProperty: (objectId: string, prop: string, value: string | number | boolean) => void;
	} = $props();

	function update(prop: string, value: string | number | boolean) {
		if (selectedObject) {
			onUpdateProperty(selectedObject.id, prop, value);
		}
	}

	function numInput(prop: string, e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		if (!isNaN(val)) update(prop, val);
	}

	function textInput(prop: string, e: Event) {
		update(prop, (e.target as HTMLInputElement).value);
	}

	function checkboxInput(prop: string, e: Event) {
		update(prop, (e.target as HTMLInputElement).checked);
	}

	function customPropInput(key: string, value: string | number | boolean, e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		if (typeof value === 'number') {
			const n = parseFloat(raw);
			if (!isNaN(n)) update(`props.${key}`, n);
		} else if (typeof value === 'boolean') {
			update(`props.${key}`, (e.target as HTMLInputElement).checked);
		} else {
			update(`props.${key}`, raw);
		}
	}

	function getObjLabel(objType: string) {
		return OBJ_TYPES[objType]?.label ?? objType;
	}
</script>

<div class="panel properties-panel">
	{#if selectedObject}
		<div class="panel-header">Properties — {getObjLabel(selectedObject.objType)}</div>

		<!-- Identity -->
		<section class="prop-section">
			<div class="section-label">Identity</div>
			<div class="prop-row">
				<label>Name</label>
				<input type="text" value={selectedObject.name} onchange={(e) => textInput('name', e)} />
			</div>
			<div class="prop-row">
				<label>Type</label>
				<span class="prop-readonly">{getObjLabel(selectedObject.objType)}</span>
			</div>
		</section>

		<!-- Transform -->
		<section class="prop-section">
			<div class="section-label">Transform</div>
			<div class="prop-row">
				<label>X</label>
				<input type="number" value={selectedObject.x} onchange={(e) => numInput('x', e)} />
			</div>
			<div class="prop-row">
				<label>Y</label>
				<input type="number" value={selectedObject.y} onchange={(e) => numInput('y', e)} />
			</div>
			<div class="prop-row">
				<label>W</label>
				<input type="number" value={selectedObject.w} onchange={(e) => numInput('w', e)} />
			</div>
			<div class="prop-row">
				<label>H</label>
				<input type="number" value={selectedObject.h} onchange={(e) => numInput('h', e)} />
			</div>
		</section>

		<!-- Appearance -->
		<section class="prop-section">
			<div class="section-label">Appearance</div>
			<div class="prop-row">
				<label>Color</label>
				<input type="color" value={selectedObject.color} onchange={(e) => textInput('color', e)} />
			</div>
			<div class="prop-row">
				<label>Visible</label>
				<input type="checkbox" checked={selectedObject.visible} onchange={(e) => checkboxInput('visible', e)} />
			</div>
			<div class="prop-row">
				<label>Locked</label>
				<input type="checkbox" checked={selectedObject.locked} onchange={(e) => checkboxInput('locked', e)} />
			</div>
		</section>

		<!-- Custom Props -->
		{#if Object.keys(selectedObject.props).length > 0}
			<section class="prop-section">
				<div class="section-label">Custom Properties</div>
				{#each Object.entries(selectedObject.props) as [key, value] (key)}
					<div class="prop-row">
						<label>{key}</label>
						{#if typeof value === 'boolean'}
							<input
								type="checkbox"
								checked={value}
								onchange={(e) => customPropInput(key, value, e)}
							/>
						{:else if typeof value === 'number'}
							<input
								type="number"
								value={value}
								onchange={(e) => customPropInput(key, value, e)}
							/>
						{:else}
							<input
								type="text"
								value={value}
								onchange={(e) => customPropInput(key, value, e)}
							/>
						{/if}
					</div>
				{/each}
			</section>
		{/if}
	{:else}
		<div class="panel-header">Properties</div>
		<div class="no-selection">No object selected</div>
	{/if}
</div>

<style>
	.prop-section {
		border-bottom: 1px solid var(--border);
		padding: 6px 0;
	}

	.section-label {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: 2px 8px 4px;
	}

	.prop-row {
		display: flex;
		align-items: center;
		padding: 2px 8px;
		gap: 8px;
	}

	.prop-row label {
		font-size: 11px;
		color: var(--text-secondary);
		width: 52px;
		flex-shrink: 0;
	}

	.prop-row input[type="text"],
	.prop-row input[type="number"] {
		flex: 1;
		width: 0;
	}

	.prop-row input[type="color"] {
		width: 36px;
		height: 20px;
		padding: 0 2px;
		cursor: pointer;
	}

	.prop-row input[type="checkbox"] {
		cursor: pointer;
	}

	.prop-readonly {
		font-size: 11px;
		color: var(--text-muted);
	}

	.no-selection {
		font-size: 11px;
		color: var(--text-muted);
		padding: 16px 8px;
		text-align: center;
	}
</style>
