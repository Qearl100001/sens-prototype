import relationGlyph from '../assets/relation-glyph.svg';
import relationInner from '../assets/relation-inner.svg';
import relationLine from '../assets/relation-line.svg';
import relationOuter from '../assets/relation-outer.svg';

export function MappingRelationGraphic({ withLines = false }: { withLines?: boolean }) {
  return (
    <span className={withLines ? 'mapping-link mapping-link--wide' : 'mapping-link'} aria-hidden>
      {withLines ? <img className="mapping-link__line" src={relationLine} alt="" /> : null}
      <span className="mapping-link__circle">
        <img className="mapping-link__outer" src={relationOuter} alt="" />
        <img className="mapping-link__inner" src={relationInner} alt="" />
        <img className="mapping-link__glyph" src={relationGlyph} alt="" />
      </span>
      {withLines ? <img className="mapping-link__line" src={relationLine} alt="" /> : null}
    </span>
  );
}
