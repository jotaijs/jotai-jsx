import { atom } from 'jotai';
import { useAtom } from 'jotai-jsx';

import { VisibilityFilterType, stateAtom } from '../state';

const setVisibilityFilterAtom = atom(
  (get) => get(stateAtom).visibilityFilter,
  (_get, set, filter: VisibilityFilterType) => {
    set(stateAtom, (prev) => ({
      ...prev,
      visibilityFilter: filter,
    }));
  },
);

const useVisibilityFilter = () => {
  const [visibilityFilter, setVisibilityFilter] = useAtom(
    setVisibilityFilterAtom,
  );
  return [visibilityFilter, setVisibilityFilter] as [
    VisibilityFilterType,
    typeof setVisibilityFilter,
  ];
};

export default useVisibilityFilter;
