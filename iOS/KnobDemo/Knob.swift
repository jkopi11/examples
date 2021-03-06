//
//  Knob.swift
//  KnobDemo
//
//  Created by Joe Kopinski on 12/4/16.
//  Copyright © 2016 Mikael Konutgan. All rights reserved.
//

import UIKit

private extension Selector {
    static let handleRotation = #selector(Knob.handleRotation)
}

enum KnobAnimationState {
    case Continuous
    case ValueChange
    case GestureEnd
}

class Knob: UIControl {
    
    private var backingValue: Float = 0.0
    
    /** Contains the receiver’s current value. */
    public var value: Float {
        get { return backingValue }
        set { setValue(value: newValue,animated:false)}
    }
    
    /** Sets the receiver’s current value, allowing you to animate the change visually. */
    public func setValue(value: Float, animated: Bool) {
        if value != self.value {
            // Save the value to the backing value
            // Make sure we limit it to the requested bounds
            self.backingValue = min(maximumValue, max(minimumValue, value))
            
            // Update the knob to the correct angle
            let angleRange = endAngle - startAngle
            let valueRange = CGFloat(maximumValue - minimumValue)
            let angle = CGFloat(value - minimumValue) / valueRange * angleRange + startAngle
            knobRenderer.setPointerAngle(pointerAngle: angle, animated: animated)
        }
    }
    
    /** Contains the minimum value of the receiver. */
    public var minimumValue: Float = 0.0
    
    /** Contains the maximum value of the receiver. */
    public var maximumValue: Float = 1.0
    
    /** Contains a Boolean value indicating whether changes
     in the sliders value generate continuous update events. */
    public var animationState:KnobAnimationState = .ValueChange
    
    private let knobRenderer = KnobRenderer()
    
    /** Specifies the angle of the start of the knob control track. Defaults to -11π/8 */
    public var startAngle: CGFloat {
        get { return knobRenderer.startAngle }
        set { knobRenderer.startAngle = newValue }
    }
    
    /** Specifies the end angle of the knob control track. Defaults to 3π/8 */
    public var endAngle: CGFloat {
        get { return knobRenderer.endAngle }
        set { knobRenderer.endAngle = newValue }
    }
    
    /** Specifies the width in points of the knob control track. Defaults to 2.0 */
    public var lineWidth: CGFloat {
        get { return knobRenderer.lineWidth }
        set { knobRenderer.lineWidth = newValue }
    }
    
    /** Specifies the length in points of the pointer on the knob. Defaults to 6.0 */
    public var pointerLength: CGFloat {
        get { return knobRenderer.pointerLength }
        set { knobRenderer.pointerLength = newValue }
    }
    
    public override init (frame: CGRect) {
        super.init(frame: frame)
        createSublayers()
        
        let gr = RotationGestureRecognizer(target: self, action: .handleRotation)
        self.addGestureRecognizer(gr)
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func createSublayers() {
        knobRenderer.update(bounds: bounds)
        knobRenderer.startAngle = -CGFloat(M_PI * 11.0 / 8.0)
        knobRenderer.endAngle = CGFloat(M_PI * 3.0 / 8.0)
        knobRenderer.pointerAngle = knobRenderer.startAngle
        knobRenderer.lineWidth = 2.0
        knobRenderer.pointerLength = 12.0
        
        layer.addSublayer(knobRenderer.trackLayer)
        layer.addSublayer(knobRenderer.pointerLayer)
    }

    public override func tintColorDidChange() {
        knobRenderer.strokeColor = tintColor
    }
    
    func handleRotation(sender: Any) {
        let gr = sender as! RotationGestureRecognizer
        
        let midPointAngle = (2.0 * CGFloat(M_PI) + self.startAngle - self.endAngle) / 2.0 + self.endAngle
        
        // Ensure the angle is within a suitable range
        var boundedAngle = gr.rotation
        if boundedAngle > midPointAngle {
            boundedAngle -= 2.0 * CGFloat(M_PI)
        } else if boundedAngle < (midPointAngle - 2.0 * CGFloat(M_PI)) {
            boundedAngle += 2 * CGFloat(M_PI)
        }
        
        boundedAngle = min(self.endAngle, max(self.startAngle, boundedAngle))
        
        // Convert the angle to a value
        let angleRange = endAngle - startAngle
        let valueRange = maximumValue - minimumValue
        let valueForAngle = Float(boundedAngle - startAngle) / Float(angleRange) * valueRange + minimumValue
        
        switch animationState {
        case .GestureEnd:
            if gr.state == UIGestureRecognizerState.ended || gr.state == UIGestureRecognizerState.cancelled {
                sendActions(for: .valueChanged)
            }
        case .ValueChange:
            print("floor old: \(floorf(valueForAngle)) new: \(floorf(self.value))")
            if floorf(valueForAngle) != floorf(self.value) {
                sendActions(for: .valueChanged)
            }
        default:
            sendActions(for: .valueChanged)
        }
        
        self.value = floorf(valueForAngle)
    }
}

private class KnobRenderer {
    
    var trackLayer = CAShapeLayer()
    var pointerLayer = CAShapeLayer()
    
    var strokeColor: UIColor {
        get {
            return UIColor(cgColor: trackLayer.strokeColor!)
        }
        set(strokeColor) {
            pointerLayer.strokeColor = strokeColor.cgColor
        }
    }
    
    var lineWidth: CGFloat = 1.0 {
        didSet { update() }
    }
    var startAngle: CGFloat = 0.0 {
        didSet { update() }
    }
    var endAngle: CGFloat = 0.0 {
        didSet { update() }
    }
    var pointerLength: CGFloat = 0.0 {
        didSet { update() }
    }
    
    var backingPointerAngle: CGFloat = 0.0
    
    var pointerAngle: CGFloat {
        get { return backingPointerAngle }
        set { setPointerAngle(pointerAngle: newValue, animated: false) }
    }
    
    func setPointerAngle(pointerAngle: CGFloat, animated: Bool) {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        
        pointerLayer.transform = CATransform3DMakeRotation(pointerAngle, 0.0, 0.0, 0.1)
        
        if animated {
            let midAngle = (max(pointerAngle, self.pointerAngle) - min(pointerAngle, self.pointerAngle)) / 2.0 + min(pointerAngle, self.pointerAngle)
            let animation = CAKeyframeAnimation(keyPath: "transform.rotation.z")
            animation.duration = 0.25
            
            animation.values = [self.pointerAngle, midAngle, pointerAngle]
            animation.keyTimes = [0.0,0.5,1.0]
            animation.timingFunction = CAMediaTimingFunction(name: kCAMediaTimingFunctionEaseInEaseOut)
            pointerLayer.add(animation, forKey: nil)
        }
        
        CATransaction.commit()
        
        self.backingPointerAngle = pointerAngle
    }
    
    init () {
        trackLayer.fillColor = UIColor.clear.cgColor
        trackLayer.strokeColor = UIColor.lightGray.cgColor
        pointerLayer.fillColor = UIColor.clear.cgColor
    }
    
    func update() {
        pointerLayer.lineWidth = lineWidth
        
        updateTrackLayerPath()
        updatePointerLayerPath()
    }
    
    func update(bounds: CGRect) {
        let position = CGPoint(x: bounds.width/2.0, y: bounds.height/2.0)
        
        trackLayer.bounds = bounds
        trackLayer.position = position
        
        pointerLayer.bounds = bounds
        pointerLayer.position = position
        
        update()
    }
    
    func updateTrackLayerPath() {
        let arcCenter = CGPoint(x: trackLayer.bounds.width/2.0, y: trackLayer.bounds.height/2.0)
        let offset = max(pointerLength/2.0, trackLayer.lineWidth/2.0)
        let radius = min(trackLayer.bounds.height, trackLayer.bounds.width) / 2.0 - offset
        let path = UIBezierPath(arcCenter: arcCenter, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: true)
        
        
        let arcLength = floor(Double((endAngle - startAngle) * radius))
        
        print("pointerLength: \(pointerLength) arcLength: \(arcLength)")
        let unitLength = arcLength/30
        print("unitLength: \(unitLength)")
        let dashLength = NSNumber(value:unitLength*0.1)
        let dashSpace = NSNumber(value:unitLength*0.9)
        
        let dashes:[NSNumber] = [dashLength,dashSpace]
        trackLayer.lineWidth = pointerLength
        trackLayer.lineDashPattern = dashes
        trackLayer.lineCap = "butt"
        trackLayer.path = path.cgPath
    }
    
    func updatePointerLayerPath() {
        let path = UIBezierPath()
        path.move(to: CGPoint(x: pointerLayer.bounds.width - pointerLength - pointerLayer.lineWidth / 2.0, y: pointerLayer.bounds.height / 2.0))
        path.addLine(to: CGPoint(x: pointerLayer.bounds.width, y: pointerLayer.bounds.height / 2.0))
        pointerLayer.path = path.cgPath
    }
}

import UIKit.UIGestureRecognizerSubclass

private class RotationGestureRecognizer: UIPanGestureRecognizer {
    var rotation:CGFloat = 0.0
    
    override init(target:Any?, action: Selector?) {
        super.init(target:target, action: action)
        minimumNumberOfTouches = 1
        maximumNumberOfTouches = 1
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesBegan(touches, with: event)
        
        updateRotationWithTouches(touches: touches)
    }
    
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesMoved(touches, with: event)
        
        updateRotationWithTouches(touches: touches)
    }
    
    func updateRotationWithTouches(touches: Set<NSObject>) {
        if let touch = touches[touches.startIndex] as? UITouch {
            self.rotation = rotationForLocation(location: touch.location(in: self.view))
        }
    }
    
    func rotationForLocation(location: CGPoint) -> CGFloat {
        if let view = view {
            let offset = CGPoint(x: location.x - view.bounds.midX, y: location.y - view.bounds.midY)
            return atan2(offset.y, offset.x)
        }
        return 0.0 as CGFloat
    }
}
