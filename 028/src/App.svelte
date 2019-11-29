<script>
	import P5 from "./P5.svelte"

	const sketch = function(p5) {

	  p5.setup = () => {
			p5.createCanvas(400, 480)
			p5.angleMode(p5.DEGREES)
			p5.stroke(255,0,0)
			p5.strokeWeight(50)
			p5.noFill()
		}

		p5.one = () => {
			p5.push()
			p5.arc(-60,0,200,200,90,270)
			p5.arc(60,0,200,200,-90,60)
			p5.line(-50,-100,50,-100)
			p5.line(-120,100,0,100)
			p5.pop()
		}

	  p5.draw = () => {
			p5.background(255)

			p5.translate(200,180)
			p5.rotate(-30)
			p5.one()

			p5.translate(-60,100)
			p5.rotate(180)
			p5.one()
		}
	}
</script>

<main>
	<P5 {sketch}/>
</main>