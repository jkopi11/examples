//
//  ViewController.swift
//  KnobDemo

import UIKit

private extension Selector {
    static let knobValueChanged = #selector(ViewController.knobValueChanged)
}

class ViewController: UIViewController {
    @IBOutlet var knobPlaceholder: UIView!
    @IBOutlet var valueLabel: UILabel!
    @IBOutlet var valueSlider: UISlider!
    @IBOutlet var animateSwitch: UISwitch!
    
    var knob: Knob!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        knob = Knob(frame: knobPlaceholder.bounds)
        knob.maximumValue = 90.0
        knob.minimumValue = 60.0
        valueSlider.minimumValue = 60.0
        valueSlider.maximumValue = 90.0
        valueSlider.value = 60.0
        knobPlaceholder.addSubview(knob)
        view.tintColor = UIColor.red
        knob.value = valueSlider.value
        updateLabel()
        knob.addTarget(self, action: .knobValueChanged, for: .valueChanged)
    }
    
    func knobValueChanged(knob: Knob) {
        valueSlider.value = knob.value
        updateLabel()
    }
    
    @IBAction func sliderValueChanged(_ slider: UISlider) {
        knob.value = floorf(slider.value)
        updateLabel()
    }
    
    @IBAction func randomButtonTouched(_ button: UIButton) {
        let randomValue = Float(arc4random_uniform(101))/100.0
        let thermValue = randomValue * 30 + knob.minimumValue
        knob.setValue(value: thermValue, animated: animateSwitch.isOn)
        valueSlider.setValue(thermValue, animated: animateSwitch.isOn)
    }
    
    func updateLabel() {
        valueLabel.text = NumberFormatter.localizedString(from: NSNumber(value: floor(knob.value)), number: .none)
    }
}
