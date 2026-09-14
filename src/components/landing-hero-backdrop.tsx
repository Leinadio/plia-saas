import styles from "./landing.module.css";

export function LandingHeroBackdrop() {
  return (
    <div className={styles.heroBackdrop} aria-hidden="true">
      <svg
        className={styles.heroBackdropWide}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
      >
        <g transform="translate(0 280) scale(1 0.6)">
          <path
            className={styles.heroRibbonSage}
            d="M-140 450C139 387 207 708 486 786C790 870 1014 590 1321 665C1500 709 1605 827 1740 778L1740 963C1420 1039 1360 746 1071 805C815 857 637 1015 360 903C103 799 86 583-140 639Z"
          />
          <path
            className={styles.heroRibbonCoral}
            d="M-120 548C117 500 168 766 399 855C627 943 821 856 1010 809C814 913 620 1007 377 914C136 822 83 610-120 645Z"
          />
          <path
            className={styles.heroRibbonLine}
            d="M-100 419C146 380 233 687 496 761C792 844 1035 548 1325 633C1491 682 1580 776 1715 738"
          />
        </g>
      </svg>
      <svg
        className={styles.heroBackdropNarrow}
        viewBox="0 0 500 1300"
        preserveAspectRatio="none"
      >
        <g transform="translate(0 360) scale(1 0.6)">
          <path
            className={styles.heroRibbonSage}
            d="M-90 648C90 596 84 788 226 874C375 964 473 878 585 1012L585 1171C386 1002 251 1095 97 944C-22 828 39 758-90 792Z"
          />
          <path
            className={styles.heroRibbonCoral}
            d="M-86 738C62 658 93 869 207 938C342 1020 444 972 579 1097L579 1132C419 1024 342 1068 194 982C72 910 61 772-86 807Z"
          />
          <path
            className={styles.heroRibbonLine}
            d="M-90 611C111 568 102 773 240 850C370 923 486 847 574 963"
          />
        </g>
      </svg>
    </div>
  );
}
