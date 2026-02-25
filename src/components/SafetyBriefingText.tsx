export default function SafetyBriefingText() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h2 className="text-lg font-bold text-brand-900 mb-4">Safety Briefing Confirmation</h2>
      <p className="text-sm italic text-gray-600 mb-4">
        Before operating the jet ski, I confirm that a staff member explained the following safety
        information and that I fully understand these rules and procedures.
      </p>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">1. Required Safety Equipment</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>I was provided with a U.S. Coast Guard–approved life jacket and understand it must be worn at all times while on the jet ski.</li>
        <li>I understand how to properly secure the life jacket.</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">2. Basic Operation of the Jet Ski</h3>
      <p className="text-sm mb-2">I was shown and understand:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>How to start and stop the jet ski</li>
        <li>Throttle control and steering</li>
        <li>Emergency shut-off / safety lanyard</li>
        <li>How to safely accelerate and slow down</li>
        <li>How to maintain control in waves and wakes</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">3. Riding Rules</h3>
      <p className="text-sm mb-2">I understand and agree to:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Operate at safe speeds</li>
        <li>Stay within designated riding areas</li>
        <li>Keep safe distances from:
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>Other vessels</li>
            <li>Docks</li>
            <li>Swimmers</li>
            <li>Shorelines</li>
          </ul>
        </li>
        <li>Follow all Florida boating laws</li>
        <li>Not operate recklessly or perform dangerous maneuvers</li>
        <li>Only allow authorized operators</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">4. Prohibited Activities</h3>
      <p className="text-sm mb-2">I understand the following are NOT allowed:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Operating under the influence of drugs or alcohol</li>
        <li>Allowing unauthorized drivers</li>
        <li>Towing people or objects</li>
        <li>Riding at night (unless authorized)</li>
        <li>Racing or unsafe behavior</li>
        <li>Entering restricted areas</li>
      </ul>
      <p className="text-sm font-semibold text-red-600 mt-2">
        Violation may result in termination of the rental without refund.
      </p>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">5. What To Do If the Jet Ski Capsizes</h3>
      <p className="text-sm mb-2">If the jet ski flips:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Stay calm and remain with the watercraft</li>
        <li>Ensure all riders are safe and wearing life jackets</li>
        <li>Turn the jet ski upright in the correct direction as instructed</li>
        <li>Reboard from the rear of the jet ski</li>
        <li>If the jet ski will not start, signal for assistance</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">6. Emergency Procedures</h3>
      <p className="text-sm mb-2">In case of emergency:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Return to the dock if possible</li>
        <li>Contact staff immediately</li>
        <li>Stay with the watercraft if stranded</li>
        <li>Follow all instructions from staff</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">7. Weather and Water Conditions</h3>
      <p className="text-sm mb-2">I understand that:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Weather and water conditions can change quickly</li>
        <li>Staff may require me to return to shore for safety</li>
        <li>My rental may be ended early if conditions become unsafe</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">8. Responsibility for Damage</h3>
      <p className="text-sm mb-2">I understand that I am responsible for:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Damage to the jet ski</li>
        <li>Negligent operation</li>
        <li>Lost equipment</li>
        <li>Recovery or towing costs</li>
      </ul>

      <h3 className="text-base font-bold text-brand-900 mt-5 mb-2">9. Questions and Understanding</h3>
      <p className="text-sm mb-2">I confirm:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>I had the opportunity to ask questions</li>
        <li>All safety rules were explained</li>
        <li>I understand how to operate the jet ski safely</li>
      </ul>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm font-semibold text-brand-900">Acknowledgment</p>
        <p className="text-sm text-gray-700 mt-1">
          By signing below, I confirm that I received and understand the safety briefing and agree
          to follow all rules and instructions.
        </p>
      </div>
    </div>
  );
}
