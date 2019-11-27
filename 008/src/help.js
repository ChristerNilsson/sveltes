const helpTexts = {

	L1grid:
`<script>
  import range from 'lodash.range'
  const N=200
</script>

<style>
  .grid {
    stroke:#ccc; 
    fill:#888;
  }
  * {
    shape-rendering:crispEdges;
    stroke:black;
    fill:white;
  }
</style>

<svg width={N} height={N}>
  <rect width={N} height={N} class=grid/>
  {#each range(0,N,20) as i}
    <line x1={i} y1={0} x2={i} y2={N} class=grid />
    <line y1={i} x1={0} y2={i} x2={N} class=grid />
  {/each}
  <slot/>
</svg>`,

	L1rect:
`<script>
  import Grid from './Grid.svelte'
</script>

<Grid>
  <rect x=... y=... width=... height=... style='stroke-width:...; stroke:...; fill:...'/>
</Grid>`,

	L1circle:
`<circle cx=... cy=... r=.../>`,

	L1line:
`<line x1=... y1=... x2=... y2=.../>`,

	L2each:
`{#each range(...) as i}
  <circle ... />
{/each}`,

	L2if:
`{#if ... }
  <circle ... />
{:else}
  <rect ... />
{/if}`,

	L2range:
`{#each ... }
  <circle ... />
{/each}`,

	L2chess:
`{#each ...}
  {#each ...}
    {#if ...}
      <rect .../>
    {:else}
      <rect .../>
    {/if}
  {/each}
{/each}`,

	L3random:
`<...>
  import ... from '...'
  import random from 'lodash.random'
</...>

{#each range(...) as ... }
  <circle cx={random(0,200)} cy=... r=... />
{/each}`,

	L3button:
`<...>
  let i=0
</...>

<div style=...>...</div>
<button on:click = { () => i++ } > ... </button>`,

	L3shortcut:
`<...>
  let ...=17
  let ...=1
  const op=(value) => ...
</...>

<div ...> {a} to {b} </div>
<button on:click={()=>op(a+2)}> ... </button>
<button on:click={...}> ... </button>
<button on:click={()=> ... ? ... : ... } > ... </button>`,

	L4canvas:
`<svg>
  <rect ... />
</svg>`,

	L4colorPair:
`<...>
  let circles = []
  const r=...
  for (const x of [...]) {
    for (const y of [...]) {
      const color = circles.length ... == 0 ? '#00f8' : '#...'
      circles.push({..., ..., ...})
    }
  }
  const click = (...) => ... = ... .filter((...) => ... != ...)
</...>

<g stroke='#...' stroke-width=...>
  {#each ...}
    <... on:click={()=>click(c)} cx=... cy=... r=... fill=.../>
  {/each}
</g>`,

	'L5bind:':
`<...>
  let i=...
</...>

<div ...>{...}</div>
<input type=number bind:value={i}/>`,

	'L5on:keyup':
`<...>
  let key=''
  let keyCode=''
  const handleKey = (...) => {
    ... = event.key
    ... = event.keyCode
  }
</...>

<div ...> ... </div>
<div ...> ... </div>
<input on:keyup={...}/>`,

	L5guessMyNumber:
`<...>
  import ... from 'lodash.random'
  let low = 1
  let high = 127
  let guess
  let msg =''
  let secret = random(..., ...)
  const keyup = (...)=> {
    if (event.key != 'Enter') return
    if (... < ...) low = ...
    if (... > ...) high = ...
    if (... == ...) msg = ...
  }
</...>
<div ...>
  {...} to {...} {...}
  <input on:keyup = {...} type=... bind:value={...}/>
</div>`,

	L6text:
`<style>
  .fs40 {font: italic 1px serif}
</style>

<text x=... y=... class='fs40' text-anchor=... alignment-baseline=... >
  ...
</text>`,

	L6translate:
`<... y1=... y2=... style=... transform="translate(...)"/>`,

	L6rotate:
`<... y2=... style=... transform="rotate(...)"/>`,

	L6scale:
`<... y1=... y2=... style=... transform="rotate(...) scale(...)"/>`,

	L6clock:
`<...>
  import range from 'lodash.range'
  import { onMount } from 'svelte'

  let time = new Date()

  $: hours = time.getHours()
  $: minutes = time.getMinutes()
  $: seconds = time.getSeconds()

  onMount(() => {
    const interval = setInterval(() => {time = new Date()}, ...)
    return () => clearInterval(interval)
  })
</...>

<style>
  svg { width: 100%; height: 100% }
  .clock-face { stroke: ...; fill: ... }
  .minor { stroke: ...; stroke-width: ... }
  .major { stroke: ...; stroke-width: ... }
  .hour { stroke: ... }
  .minute { stroke: ... }
  .second, .second-counterweight { stroke: rgb(...,...,...) }
  .second-counterweight { stroke-width: ... }
  .fs {font-size: ... }
</style>

<svg viewBox='-50 -50 100 100'>
  <circle class='...' r = ... />

  <!-- markers -->
  {#each range(...) as i}
    <g transform = 'rotate({...})'>
      <line class='major' y1=... y2=... />

      {#each range(..., ...) as offset}
        <line class='minor' y1=... y2=... transform='rotate(...)' />
      {/each}
    </g>
  {/each}

  <!-- hands -->
  <line class='hour' y1=... y2=... transform='rotate({...})' />
  <line class='minute' y1=... y2=... transform='rotate(...)' />
  <g transform='rotate(...)'>
    <line class='second' y1=... y2=... />
    <line class='second-counterweight' y1=... y2=... />
  </g>
</svg>`

}

export {helpTexts}