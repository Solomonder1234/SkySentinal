import styles from './staff.module.css';
import staffData from '../../data/staff.json';

interface StaffMember {
  name: string;
  role: string | null;
  clearance: string;
  color: 'red' | 'blue' | 'yellow' | 'gray' | 'neonRed' | 'neonBlue' | 'blue' | 'yellow'; // Added 'blue' and 'yellow' as literal strings
  avatar?: string;
}

interface StaffTier {
  title: string;
  members: StaffMember[];
}

export default function StaffPage() {
  const staffTiers: StaffTier[] = staffData as StaffTier[];

  const getClearanceClass = (color: string) => {
    switch (color) {
      case 'red': return ''; // Red is default via original CSS
      case 'blue': return styles.clearanceBlue;
      case 'yellow': return styles.clearanceYellow;
      case 'gray': return styles.clearanceGray;
      case 'neonRed': return styles.clearanceNeonRed;
      case 'neonBlue': return styles.clearanceNeonBlue;
      default: return '';
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Network <span className={styles.highlight}>Command</span>
        </h1>
        <p className={styles.subtitle}>
          The executive board and oversight administration of the SkyAlert Network.
        </p>
      </div>

      <div className={styles.hierachyContainer}>
        {staffTiers.map((tier, tierIdx) => (
          <section key={tierIdx} className={styles.tierSection}>
            <div className={styles.tierHeader}>
              <h2 className={styles.tierTitle}>{tier.title}</h2>
              <div className={styles.tierLine}></div>
            </div>

            <div className={styles.grid}>
              {tier.members.map((staff, i) => (
                <div key={i} className={styles.card}>
                  <div className={styles.avatarBox}>
                    {staff.avatar ? (
                      <img src={staff.avatar} alt={staff.name} className={styles.avatarImg} />
                    ) : (
                      staff.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 className={styles.name}>{staff.name}</h3>
                  <div className={styles.role}>{staff.role || tier.title}</div>
                  <div className={`${styles.clearance} ${getClearanceClass(staff.color)}`}>
                    ❖ {staff.clearance} Clearance
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
