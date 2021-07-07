import useVisibilityFilter from '../hooks/useVisibilityFilter';
import { VisibilityFilterType } from '../state';

type Props = {
  filter: VisibilityFilterType;
  children: any;
};

const FilterLink = ({ filter, children }: Props) => {
  const [visibilityFilter, setVisibilityFilter] = useVisibilityFilter();
  const active = filter === visibilityFilter;
  return (
    <button
      type="button"
      onClick={() => setVisibilityFilter(filter)}
      disabled={active}
      style={{
        marginLeft: '4px',
      }}
    >
      {children}
    </button>
  );
};

export default FilterLink;
