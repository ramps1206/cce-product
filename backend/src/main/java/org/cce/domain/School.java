package org.cce.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "schools")
public class School {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true)
    private String udise;

    private String name = "";
    private String address = "";
    private String dist = "";
    private String tal = "";
    private String phone = "";
    private String prin = "";
    private String med = "मराठी";
    private String yr = "";

    @Column(name = "type")
    private String type = "";

    @Column(name = "school_code")
    private String schoolCode = "";

    @Column(name = "est_year")
    private String estYear = "";

    @Column(columnDefinition = "text")
    private String logo;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getUdise() { return udise; }
    public void setUdise(String udise) { this.udise = udise; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDist() { return dist; }
    public void setDist(String dist) { this.dist = dist; }
    public String getTal() { return tal; }
    public void setTal(String tal) { this.tal = tal; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPrin() { return prin; }
    public void setPrin(String prin) { this.prin = prin; }
    public String getMed() { return med; }
    public void setMed(String med) { this.med = med; }
    public String getYr() { return yr; }
    public void setYr(String yr) { this.yr = yr; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSchoolCode() { return schoolCode; }
    public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
    public String getEstYear() { return estYear; }
    public void setEstYear(String estYear) { this.estYear = estYear; }
    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
