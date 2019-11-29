<script>
	import P5Canvas from "./P5Canvas.svelte"

	let sketch = function(p5) {
	  let w;
	  let columns;
	  let rows;
	  let board;
	  let next;

	  p5.setup = () => {
			p5.createCanvas(800, 800)
			p5.angleMode(p5.DEGREES)
		}

	  p5.draw = () => {
			p5.background(255)
			p5.stroke(255,0,0)
			p5.strokeWeight(50)
			p5.noFill()
			p5.translate(200,400)

			// p5.rotate(-30)

			p5.push()
			p5.rotate(-90)
			// p5.stroke(255,255,0)
			p5.arc(0,0,200,200,180,330)
			p5.rotate(90)
			p5.translate(125,0)
			p5.arc(0,0,200,200,-90,90)
			// p5.stroke(0,255,0)
			p5.line(-75,-100,60,-100)
			p5.line(0,100,-125,100)
			p5.pop()

			p5.translate(60,-100)
			p5.push()
			p5.rotate(-90)
			p5.arc(0,0,200,200,180,360)
			p5.rotate(90)
			p5.translate(125,0)
			p5.arc(0,0,200,200,-90,60)
			// p5.stroke(0,0,255)
			p5.line(0,-100,-125,-100)
			p5.line(-200,100,-50,100)
			p5.pop()

	  }
	}
</script>

<main>
  <P5Canvas sketch={sketch}/>
</main>