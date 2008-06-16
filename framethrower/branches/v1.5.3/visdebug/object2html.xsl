<xsl:stylesheet
    xmlns:f="http://www.filmsfolded.com/xsl/ui"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:svg="http://www.w3.org/2000/svg"
	version="1.0">

	<xsl:param name="params" />

	<xsl:template match="object|situation|individual">
		<html:div>
			<xsl:call-template name="position">
				<xsl:with-param name="xvar" select="x - 10" />
				<xsl:with-param name="yvar" select="y - 10" />
			</xsl:call-template>
			<xsl:if test="$params = 'id'">
				<xsl:value-of select="id"/>
			</xsl:if>
			<xsl:if test="$params = 'all'">
				<xsl:apply-templates>
					<xsl:with-param name="xpos" select="5"/>
				</xsl:apply-templates>
			</xsl:if>
		</html:div>
	</xsl:template>
	
	<xsl:template match="link">
	</xsl:template>
	
	<xsl:template match="*">
		<xsl:param name="xpos" />
		<html:div style="position:relative;left:{$xpos}px;">
			<xsl:value-of  select="name()"/>: 
			<xsl:apply-templates>
				<xsl:with-param name="xpos" select="$xpos+15"/>
			</xsl:apply-templates>
		</html:div>
	</xsl:template>
	
	<xsl:template name="position">
		<xsl:param name="xvar" />
		<xsl:param name="yvar" />
		<xsl:attribute name="style">
			<xsl:value-of select="'position: absolute;'" />
			<!--
			<xsl:value-of select="concat('position: absolute; left: ', $xvar, 'px; top: ', $yvar, 'px;')" />
			!-->
		</xsl:attribute>
	</xsl:template>
</xsl:stylesheet>