'use client';

import { useState } from 'react';

const CHECKLIST_ITEMS = [
  'Operator responsibility: Operator is responsible for the safe and proper operation of the vessel; Avoid careless, reckless and negligent operation of vessels; Effects of alcohol, controlled substances and stressors',
  'Navigation rules: Maintain a proper lookout; keep a safe distance from other vessels and objects; operate at a safe speed for the conditions, location and environment; operate in a defensive manner; requirements to give way to other vessels; and vessel right of way',
  'Aids to navigation; buoys and other waterways markers',
  'Special waterway hazards: Operation within 300 feet of emergency vessels with activated emergency lights or within 300 feet of construction vessels displaying an orange flag',
  'Awareness of changes to weather or water conditions and proper responses to those changes',
  'Requirements for operating a vessel while a person is waterskiing or participating in similar activities identified in s. 327.37, F.S., if applicable',
  'Propulsion, steering and stopping characteristics of vessels: In general as well as for the specific vessel being leased or rented',
  'Location and content of manufacturer warning labels',
  'Location of and proper use of safety equipment',
  'Boarding, falling off, capsizing, taking on water, re-boarding and emergency procedures for dealing with these situations',
  'Problems seeing other vessels and being seen by them',
  'Dangers of reckless operations, such as wake surfing and jumping',
  'Boating safety identification cards, age and engine requirements',
  'Photographic identification',
  'Boating accidents: Causes and prevention of accidents; legal requirements: remain on-scene, render assistance, report incident to authorities',
  'Florida divers-down warning device requirements',
  'Noise, nuisances and other environmental concerns',
  'Manatee awareness (if applicable to location)',
  'Ecosystem awareness based on local issues',
  'Specific operational characteristics of the vessel being leased or rented',
  'Local characteristics of the waterway where the vessel is intended to be operated, including navigational hazards, boating restricted areas, and water depths',
];

const PWC_ITEMS = [
  'Specific personal watercraft (PWC) safety requirements: Required to wear PFD; Required use of kill switch lanyard; Location of sound producing device and fire extinguisher; Minimum age to legally operate; Lawful hours of operation',
];

interface Props {
  onComplete: (allChecked: boolean) => void;
}

export default function FWCAttestationChecklist({ onComplete }: Props) {
  const totalItems = CHECKLIST_ITEMS.length + PWC_ITEMS.length;
  const [checked, setChecked] = useState<boolean[]>(new Array(totalItems).fill(false));

  const toggle = (index: number) => {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
    onComplete(next.every(Boolean));
  };

  const checkAll = () => {
    const allChecked = checked.every(Boolean);
    const next = new Array(totalItems).fill(!allChecked);
    setChecked(next);
    onComplete(!allChecked);
  };

  const checkedCount = checked.filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h4 className="font-bold text-brand-900 text-sm">Florida Fish and Wildlife Conservation Commission</h4>
        <h3 className="font-bold text-brand-900">Livery Pre-Rental and Pre-Ride Instruction</h3>
        <h3 className="font-bold text-brand-900">Checklist and Attestation</h3>
        <p className="text-xs text-gray-500 mt-1">(Motorized Vessels) &mdash; FWCDLE_313A &mdash; Rule 68D-34.002, F.A.C.</p>
      </div>

      <p className="text-xs text-gray-600 mb-3">
        Check each box to indicate you received instruction on the following topics:
      </p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-brand-600 font-medium">{checkedCount} of {totalItems} checked</span>
        <button
          type="button"
          onClick={checkAll}
          className="text-xs text-brand-500 hover:text-brand-700 font-medium underline"
        >
          {checked.every(Boolean) ? 'Uncheck All' : 'Check All'}
        </button>
      </div>

      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item, i) => (
          <label key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => toggle(i)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
            />
            <span className="text-xs text-gray-700 leading-relaxed">{item}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="font-bold text-brand-900 text-sm mb-2">Personal Watercraft</h4>
        {PWC_ITEMS.map((item, i) => {
          const idx = CHECKLIST_ITEMS.length + i;
          return (
            <label key={idx} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={checked[idx]}
                onChange={() => toggle(idx)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
              />
              <span className="text-xs text-gray-700 leading-relaxed">{item}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 italic">
          I hereby acknowledge I have received the required pre-rental and pre-ride instruction on each acknowledged component listed above, and I understand the rules and information provided in this orientation.
        </p>
      </div>
    </div>
  );
}
