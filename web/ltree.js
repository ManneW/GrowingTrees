/**
 * Representation of a tree based on an L-system
 * @constructor
 */
var Tree = function() {
    // Set up default values
    this.rule = 'F[+X][-X]';
    this.generated = false;
    this.signature = '';
    this.angle = 20;
    this.noise = null;
};

/**
 * Set the noise implementation to use
 *
 * Currently any provided noise implementation gets
 * overridden by the standard Math.random() method.
 *
 * Setting the noise to null disables noise
 * (including the Math.random() generated), though.
 *
 * @param newNoise
 */
Tree.prototype.setNoise = function(newNoise) {
    this.noise = newNoise;
};

/**
 * Set the rule for the L-system
 *
 * @param newRule
 */
Tree.prototype.setRule = function(newRule) {
    this.rule = newRule;
};

/**
 * Set the angle to use when branching.
 *
 * @param newAngle
 */
Tree.prototype.setAngle = function(newAngle) {
    this.angle = newAngle;
};

/**
 * Generate the tree signature by applying the L-system rule.
 *
 * @param iterations Number of iterations to apply the rule
 */
Tree.prototype.generate = function(iterations) {
    if (iterations == undefined) {
        iterations = 4;
    }

    var me = this;

    var rewriteRule = function(rule) {
        return rule.replace(/X/g, me.rule);
    };

    var iter = 0;
    var finalRule = me.rule;

    while (iter++ < iterations) {
        finalRule = rewriteRule(finalRule);
    }

    this.signature = finalRule;
    me.generated = iterations;
};

/**
 * Draw the tree on the specified canvas.
 *
 * It is possible to provide both branchLength and number of iterations.
 *
 * Regeneration of the tree signature is only done if it is required
 * implicitly by the number of iterations specified.
 *
 * @param canvas
 * @param x
 * @param y
 * @param branchLength
 * @param iterations
 */
Tree.prototype.draw = function(canvas, x, y, branchLength, iterations) {
    var me = this;

    if (!me.generated || (iterations != undefined && me.generated != iterations)) {
        me.generate(iterations);
    }

    var angle = this.angle;
    var length = branchLength;// - 10*(iterations/branchLength);//5 + 20/iterations;


    var context = canvas.getContext('2d');

    context.translate(canvas.width/2, canvas.height);
    context.rotate(Math.PI);

    // Calculate the maximum number of branch levels in the currently generated signature
    var maxBranchLevel = 0;
    var maxFound = 0;
    var character = null;
    for (var i = 0; i < me.signature.length; i++) {
        character = me.signature.charAt(i);
        if (character == '[') {
            maxBranchLevel += 1;
        } else if (character == ']') {
            maxBranchLevel -= 1;
        }

        if (maxBranchLevel > maxFound) {
            maxFound = maxBranchLevel;
        }

        if (maxBranchLevel < 0) {
            maxBranchLevel = 0;
        }
    }
    maxBranchLevel = maxFound;

    var branchLevel = 1;
    for (var j = 0; j < me.signature.length; j++) {
        character = me.signature.charAt(j);
        switch (character) {
            // Draw a straight line
            case 'F':
                // Determine a suitable branchWidth and branchLength according
                // to the current branchLevel (discrete distance from the base of the tree)
                // This is used for the stroke opafity as well.
                var branchWidth = 0.9*(maxBranchLevel-branchLevel);
                var branchLength = Math.ceil(length/branchLevel);
                var branchAlpha = (1.5 - (branchLevel/maxBranchLevel));
                if (branchAlpha > 1) { branchAlpha = 1; }
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, branchLength);
                context.strokeStyle = 'rgba(165, 100, 25, '+ branchAlpha + ')';
                context.lineWidth = branchWidth;
                context.lineCap = 'round';
                context.stroke();
                context.translate(0, branchLength + branchWidth/2);
                break;

            // Create and draw a leaf
            case 'X':
                // Determine the leaf size
                var leafSize = (iterations + branchLength/10)/10;
                context.save();
                context.translate(0, -2*leafSize);
                context.moveTo(0,0);
                context.scale(1, 2);
                context.beginPath();
                context.arc(0, 0, leafSize, 0, 2*Math.PI, false);
                context.fillStyle = 'rgba(0, ' + (100 + Math.round(100*Math.random())) +', 0, 1)';
                context.fill();
                context.restore();
                break;

            // New branch level - save the context (push)
            case '[':
                branchLevel += 1;
                context.save();
                break;

            // Finished branch level - restore the context (pop)
            case ']':
                context.restore();
                branchLevel -= 1;
                break;

            // Make a turn clockwise
            case '+':
                if (me.noise != null) {
                    angle = me.angle + 10*(Math.random() - 0.5);
                }
                context.moveTo(0,0);
                context.rotate(angle * Math.PI / 180);
                break;

            // Make a turn counter clockwise
            case '-':
                if (me.noise != null) {
                    angle = me.angle + 10*(Math.random() - 0.5);
                }
                context.moveTo(0,0);
                context.rotate(-angle * Math.PI / 180);
                break;
        }
    }

    // Reset transformations made
    context.setTransform(1, 0, 0, 1, 0, 0);

};
