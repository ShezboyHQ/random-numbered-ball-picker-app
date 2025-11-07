class BingoCage {
    constructor() {
        this.startButton = document.getElementById('startButton');
        this.minInput = document.getElementById('minNumber');
        this.maxInput = document.getElementById('maxNumber');
        this.ballsContainer = document.getElementById('ballsContainer');
        this.sphereContainer = document.querySelector('.sphere-container');
        this.resultDiv = document.getElementById('result');
        this.isAnimating = false;
        this.balls = [];

        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.startPicking());
    }

    createBalls(min, max) {
        this.ballsContainer.innerHTML = '';
        this.balls = [];

        const totalNumbers = max - min + 1;

        for (let i = min; i <= max; i++) {
            const ball = document.createElement('div');
            ball.className = 'ball';

            // Alternate between red and black
            ball.classList.add(i % 2 === 0 ? 'red' : 'black');

            ball.textContent = i;
            ball.dataset.number = i;

            // Random initial position within the cage
            const angle = Math.random() * 360;
            const radius = Math.random() * 140 + 50; // Random distance from center
            const x = Math.cos(angle * Math.PI / 180) * radius + 200; // Center is at 225px
            const y = Math.sin(angle * Math.PI / 180) * radius + 200;

            ball.style.left = x + 'px';
            ball.style.top = y + 'px';

            this.ballsContainer.appendChild(ball);
            this.balls.push({
                element: ball,
                number: i,
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3
            });
        }
    }

    animateBalls(duration = 6000) {
        const startTime = Date.now();
        const centerX = 225;
        const centerY = 225;
        const maxRadius = 175; // Keep balls within the cage

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1 && this.isAnimating) {
                this.balls.forEach(ball => {
                    // Simulate air currents with circular swirling motion
                    const time = elapsed / 1000;
                    const dx = ball.x - centerX;
                    const dy = ball.y - centerY;
                    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

                    // Create swirling air effect
                    const swirl = Math.sin(time * 2 + ball.number * 0.5) * 0.8;
                    const airForceX = -dy / distanceFromCenter * swirl;
                    const airForceY = dx / distanceFromCenter * swirl;

                    // Add upward air blast at random intervals
                    const upwardForce = Math.sin(time * 3 + ball.number) * 0.3;

                    // Apply air forces
                    ball.vx += airForceX + (Math.random() - 0.5) * 1.2;
                    ball.vy += airForceY + upwardForce + (Math.random() - 0.5) * 1.2;

                    // Update position
                    ball.x += ball.vx;
                    ball.y += ball.vy;

                    // Bounce off edges (circular boundary) - softer bounce for light plastic
                    if (distanceFromCenter > maxRadius) {
                        const angle = Math.atan2(dy, dx);
                        ball.x = centerX + Math.cos(angle) * maxRadius;
                        ball.y = centerY + Math.sin(angle) * maxRadius;

                        // Reflect velocity with energy loss (light plastic)
                        const normalX = dx / distanceFromCenter;
                        const normalY = dy / distanceFromCenter;
                        const dotProduct = ball.vx * normalX + ball.vy * normalY;

                        ball.vx = (ball.vx - 2 * dotProduct * normalX) * 0.7;
                        ball.vy = (ball.vy - 2 * dotProduct * normalY) * 0.7;
                    }

                    // Less friction - balls are lighter and being blown by air
                    ball.vx *= 0.96;
                    ball.vy *= 0.96;

                    // Limit max velocity (lighter balls, more erratic)
                    const maxVel = 6;
                    const vel = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    if (vel > maxVel) {
                        ball.vx = (ball.vx / vel) * maxVel;
                        ball.vy = (ball.vy / vel) * maxVel;
                    }

                    // Update DOM position
                    ball.element.style.left = ball.x + 'px';
                    ball.element.style.top = ball.y + 'px';

                    // Add rotation effect based on velocity
                    if (!ball.rotation) ball.rotation = 0;
                    ball.rotation += vel * 2;
                    ball.element.style.transform = `rotate(${ball.rotation}deg)`;
                });

                // Check for collisions between balls (lighter, bouncier)
                for (let i = 0; i < this.balls.length; i++) {
                    for (let j = i + 1; j < this.balls.length; j++) {
                        const ball1 = this.balls[i];
                        const ball2 = this.balls[j];

                        const dx = ball2.x - ball1.x;
                        const dy = ball2.y - ball1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = 50; // Ball diameter

                        if (distance < minDistance && distance > 0) {
                            // Light plastic ball collision
                            const angle = Math.atan2(dy, dx);
                            const sin = Math.sin(angle);
                            const cos = Math.cos(angle);

                            // Rotate velocities
                            const vx1 = ball1.vx * cos + ball1.vy * sin;
                            const vy1 = ball1.vy * cos - ball1.vx * sin;
                            const vx2 = ball2.vx * cos + ball2.vy * sin;
                            const vy2 = ball2.vy * cos - ball2.vx * sin;

                            // Swap velocities with some energy retention (plastic bounce)
                            const restitution = 0.8;
                            const temp = vx1;
                            ball1.vx = (vx2 * restitution) * cos - vy1 * sin;
                            ball1.vy = vy1 * cos + (vx2 * restitution) * sin;
                            ball2.vx = (temp * restitution) * cos - vy2 * sin;
                            ball2.vy = vy2 * cos + (temp * restitution) * sin;

                            // Separate balls
                            const overlap = minDistance - distance;
                            const separateX = (dx / distance) * overlap * 0.5;
                            const separateY = (dy / distance) * overlap * 0.5;

                            ball1.x -= separateX;
                            ball1.y -= separateY;
                            ball2.x += separateX;
                            ball2.y += separateY;
                        }
                    }
                }

                requestAnimationFrame(animate);
            } else if (this.isAnimating) {
                // Animation complete
                this.showWinner();
            }
        };

        animate();
    }

    showWinner() {
        // Select random winning number
        const min = parseInt(this.minInput.value);
        const max = parseInt(this.maxInput.value);
        const winningNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        // Find the winning ball
        const winningBall = this.balls.find(b => b.number === winningNumber);
        if (winningBall) {
            winningBall.element.classList.add('winning');

            // Move winning ball to the bottom center (chute opening)
            setTimeout(() => {
                winningBall.element.style.transition = 'all 1s ease-out';
                winningBall.element.style.left = '200px';
                winningBall.element.style.top = '380px';
            }, 100);

            // After moving to chute opening, start sliding animation
            setTimeout(() => {
                winningBall.element.style.transition = 'none';
                winningBall.element.classList.add('sliding');

                // Display result during slide
                this.resultDiv.textContent = `Winning Number: ${winningNumber}`;
                this.resultDiv.classList.add('show');
            }, 1200);

            // Re-enable button after slide completes
            setTimeout(() => {
                this.isAnimating = false;
                this.startButton.disabled = false;
                this.startButton.textContent = 'Pick a Number!';
            }, 3500);
        } else {
            // Fallback if ball not found
            this.resultDiv.textContent = `Winning Number: ${winningNumber}`;
            this.resultDiv.classList.add('show');

            setTimeout(() => {
                this.isAnimating = false;
                this.startButton.disabled = false;
                this.startButton.textContent = 'Pick a Number!';
            }, 1000);
        }

    }

    startPicking() {
        if (this.isAnimating) return;

        const min = parseInt(this.minInput.value);
        const max = parseInt(this.maxInput.value);

        // Validation
        if (isNaN(min) || isNaN(max)) {
            alert('Please enter valid numbers');
            return;
        }

        if (min >= max) {
            alert('Minimum number must be less than maximum number');
            return;
        }

        if (max - min > 100) {
            alert('Please choose a range of 100 numbers or less for better visualization');
            return;
        }

        // Reset
        this.resultDiv.textContent = '';
        this.resultDiv.classList.remove('show');
        this.isAnimating = true;
        this.startButton.disabled = true;
        this.startButton.textContent = 'Picking...';

        // Create balls
        this.createBalls(min, max);

        // Animate balls for 6 seconds (sphere stays still)
        this.animateBalls(6000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new BingoCage();
});
