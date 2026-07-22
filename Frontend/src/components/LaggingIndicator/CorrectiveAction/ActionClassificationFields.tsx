import { Select } from '@mantine/core';
import { IconArrowBigUpLines } from '@tabler/icons-react';
import {
  CONTROL_HIERARCHY_OPTIONS, ACTION_TYPE_OPTIONS, ACTION_PRIORITY_OPTIONS, isWeakControl,
} from './correctiveLabels';

/**
 * Champs de classification d'une action corrective (ISO 45001 §8.1.2 / §10.2) :
 * hiérarchie des mesures (OBLIGATOIRE), nature, priorité — avec incitation à
 * remonter la hiérarchie si la mesure ne repose que sur l'EPI/l'administratif.
 *
 * `prefix` permet l'usage dans une liste imbriquée (ex. `correctiveActions.0.`).
 */

// Lecture d'une valeur de formulaire par chemin pointé (« a.0.b »).
const getByPath = (obj: any, path: string) =>
  path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);

interface Props {
  form: any;
  /** Préfixe de chemin, ex. `correctiveActions.0.` (avec le point final) ou ''. */
  prefix?: string;
  /** Rendre la hiérarchie obligatoire (défaut true). */
  requireHierarchy?: boolean;
}

const ActionClassificationFields = ({ form, prefix = '', requireHierarchy = true }: Props) => {
  const hierarchy = getByPath(form.values, `${prefix}controlHierarchy`);
  const weak = isWeakControl(hierarchy);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          size="sm"
          label="Hiérarchie de maîtrise"
          placeholder="Choisir"
          withAsterisk={requireHierarchy}
          data={CONTROL_HIERARCHY_OPTIONS}
          comboboxProps={{ withinPortal: true }}
          {...form.getInputProps(`${prefix}controlHierarchy`)}
        />
        <Select
          size="sm"
          label="Nature de l'action"
          placeholder="Choisir"
          clearable
          data={ACTION_TYPE_OPTIONS}
          comboboxProps={{ withinPortal: true }}
          {...form.getInputProps(`${prefix}actionType`)}
        />
        <Select
          size="sm"
          label="Priorité"
          placeholder="Choisir"
          clearable
          data={ACTION_PRIORITY_OPTIONS}
          comboboxProps={{ withinPortal: true }}
          {...form.getInputProps(`${prefix}priority`)}
        />
      </div>
      {weak && (
        <div className="flex items-start gap-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5">
          <IconArrowBigUpLines size={16} className="mt-0.5 shrink-0" />
          <span>
            Mesure de <strong>faible</strong> efficacité (EPI / administratif). Peut-on remonter d'un cran dans la
            hiérarchie — <strong>ingénierie</strong>, <strong>substitution</strong> ou <strong>élimination</strong> ?
          </span>
        </div>
      )}
    </div>
  );
};

export default ActionClassificationFields;
